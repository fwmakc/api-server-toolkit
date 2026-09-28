import { JsonLogger } from '../common/logger/json.logger';
import {
  REQUEST_ID_HEADER,
  getRequestId,
  requestContextMiddleware,
} from '../common/logger/request.context';
import { Log } from '../common/bootstrap/setup/log';
import { Morgan } from '../common/bootstrap/setup/morgan';

function mockRes(): any {
  return { setHeader: jest.fn() };
}

function runMiddleware(req: any, res: any, inside?: () => void): Promise<void> {
  return new Promise((resolve) => {
    requestContextMiddleware(req, res, () => {
      inside?.();
      resolve();
    });
  });
}

describe('requestContextMiddleware', () => {
  it('generates a UUID and echoes it on the response', async () => {
    const res = mockRes();
    await runMiddleware({ headers: {} }, res, () => {
      const id = res.setHeader.mock.calls[0][1] as string;
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
      expect(getRequestId()).toBe(id);
    });
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, expect.any(String));
  });

  it('honors a clean incoming X-Request-Id', async () => {
    const res = mockRes();
    await runMiddleware({ headers: { 'x-request-id': 'abc-123_4' } }, res, () => {
      expect(getRequestId()).toBe('abc-123_4');
    });
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'abc-123_4');
  });

  it('sanitizes and caps an unsafe incoming id', async () => {
    const res = mockRes();
    const evil = 'bad id\nwith<script>!' + 'x'.repeat(200);
    await runMiddleware({ headers: { 'x-request-id': evil } }, res);

    const id = res.setHeader.mock.calls[0][1] as string;
    expect(id).toMatch(/^[\w\-.]{1,128}$/);
    expect(id).not.toContain('\n');
    expect(id.length).toBeLessThanOrEqual(128);
  });

  it('isolates contexts between requests', async () => {
    const first = mockRes();
    const second = mockRes();
    const order: (string | undefined)[] = [];

    await new Promise<void>((resolve) =>
      requestContextMiddleware({ headers: { 'x-request-id': 'one' } }, first, () => {
        order.push(getRequestId());
        requestContextMiddleware({ headers: { 'x-request-id': 'two' } }, second, () => {
          order.push(getRequestId());
          resolve();
        });
        order.push(getRequestId());
      }),
    );

    expect(order).toEqual(['one', 'two', 'one']);
    expect(getRequestId()).toBeUndefined();
  });
});

describe('JsonLogger', () => {
  let lines: string[];
  let originals: Record<string, any>;

  beforeEach(() => {
    lines = [];
    originals = { log: console.log, error: console.error, warn: console.warn };
    console.log = jest.fn((l: string) => lines.push(l));
    console.error = jest.fn((l: string) => lines.push(l));
    console.warn = jest.fn((l: string) => lines.push(l));
  });

  afterEach(() => {
    console.log = originals.log;
    console.error = originals.error;
    console.warn = originals.warn;
  });

  it('emits one parseable JSON line per log call', () => {
    new JsonLogger().log('hello world', 'Bootstrap');

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]);
    expect(entry).toMatchObject({ level: 'log', context: 'Bootstrap', message: 'hello world' });
    expect(entry.timestamp).toBeTruthy();
    expect(entry.requestId).toBeUndefined();
  });

  it('includes the request id inside a request context', async () => {
    const res = mockRes();
    await runMiddleware({ headers: { 'x-request-id': 'req-42' } }, res, () => {
      new JsonLogger().log('during request');
      const entry = JSON.parse(lines[0]);
      expect(entry.requestId).toBe('req-42');
    });
  });

  it('treats the second error argument as stack only when context follows', () => {
    const logger = new JsonLogger();
    logger.error('boom', 'Error: boom\n    at x', 'Ctx');
    logger.error('boom2', 'SomeCtx');

    const first = JSON.parse(lines[0]);
    expect(first).toMatchObject({ level: 'error', stack: 'Error: boom\n    at x', context: 'Ctx' });
    const second = JSON.parse(lines[1]);
    expect(second).toMatchObject({ level: 'error', message: 'boom2', context: 'SomeCtx' });
    expect(second.stack).toBeUndefined();
  });

  it('serializes object messages and warns to stderr', () => {
    new JsonLogger().warn({ code: 'E1', detail: 'x' });

    const entry = JSON.parse(lines[0]);
    expect(entry).toMatchObject({ level: 'warn', message: { code: 'E1', detail: 'x' } });
  });
});

describe('Log.setup', () => {
  const useSpy = jest.fn();
  const useLoggerSpy = jest.fn();
  const app = { use: useSpy, useLogger: useLoggerSpy };
  const originalFormat = process.env.LOG_FORMAT;

  afterEach(() => {
    if (originalFormat === undefined) delete process.env.LOG_FORMAT;
    else process.env.LOG_FORMAT = originalFormat;
    useSpy.mockClear();
    useLoggerSpy.mockClear();
  });

  it('installs request context middleware + JsonLogger when LOG_FORMAT=json', () => {
    process.env.LOG_FORMAT = 'json';
    Log.setup(app);

    expect(useSpy).toHaveBeenCalledWith(requestContextMiddleware);
    expect(useLoggerSpy).toHaveBeenCalledWith(expect.any(JsonLogger));
  });

  it('keeps console behavior otherwise', () => {
    delete process.env.LOG_FORMAT;
    Log.setup(app);

    expect(useSpy).not.toHaveBeenCalled();
    expect(useLoggerSpy).toHaveBeenCalledWith(['error', 'warn', 'log']);
  });
});

describe('Morgan json format', () => {
  it('passes the format function as the first argument and includes the request id', () => {
    const morgan = require('morgan');
    const useSpy = jest.fn();
    Morgan.setup({ use: useSpy }, { format: 'json' });

    // morgan(format, options) would silently ignore a function passed as options —
    // the format function must be the first argument
    expect(morgan).toHaveBeenCalledWith(expect.any(Function));
    const formatFn = morgan.mock.calls[morgan.mock.calls.length - 1][0];

    const tokens = {
      method: () => 'GET',
      url: () => '/health',
      status: () => '200',
      'response-time': () => '3',
      'remote-addr': () => '127.0.0.1',
      res: () => undefined,
    };
    const req: any = { headers: {} };
    const res: any = {};

    // no request context → no requestId field
    const lineWithout = JSON.parse(formatFn(tokens, req, res));

    // inside a request context → requestId present
    let lineWith: any;
    runMiddleware({ headers: { 'x-request-id': 'rid-1' } }, { setHeader: jest.fn() }, () => {
      lineWith = JSON.parse(formatFn(tokens, req, res));
    });

    expect(lineWithout.requestId).toBeUndefined();
    expect(lineWith.requestId).toBe('rid-1');
    expect(lineWith).toMatchObject({ method: 'GET', url: '/health', status: 200 });
  });
});
