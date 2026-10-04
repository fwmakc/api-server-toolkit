import * as httpHelper from '../common/helper/http.helper';
import { OutboxEventClient } from '../common/client/outbox-client.service';
import { OutboxRelayWorker } from '../common/client/outbox-relay.service';
import { buildEventEnvelope } from '../common/client/outbox.envelope';
import { EventOutboxEntity } from '../common/client/outbox.entity';
import { HttpError } from '../common/helper/http.helper';

const config = (env: Record<string, string> = {}) =>
  ({
    get: (key: string, def?: string) => env[key] ?? def,
  }) as any;

const makeRepo = () => {
  const insert = jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] });
  return { insert } as any;
};

describe('buildEventEnvelope', () => {
  it('matches the HttpEventClient wire format with defaults', () => {
    expect(
      buildEventEnvelope('user.registered', { userId: 1 }, 'auth-server', null),
    ).toEqual({
      pattern: 'user.registered',
      payload: { userId: 1 },
      source: 'auth-server',
      broadcast: true,
      priority: 'normal',
    });
  });

  it('passes through optional delivery fields only when set', () => {
    const full = buildEventEnvelope(
      'p',
      {},
      's',
      { broadcast: false, priority: 'high', delay: 30, log: false, ttl: 60 },
    );
    expect(full).toEqual({
      pattern: 'p',
      payload: {},
      source: 's',
      broadcast: false,
      priority: 'high',
      delay: 30,
      log: false,
      ttl: 60,
    });
    const minimal = buildEventEnvelope('p', {}, null, {});
    expect(minimal).not.toHaveProperty('delay');
    expect(minimal).not.toHaveProperty('ttl');
  });
});

describe('OutboxEventClient', () => {
  it('queues the envelope into the outbox and does not throw', async () => {
    const repo = makeRepo();
    const client = new OutboxEventClient(repo, config({ SERVICE_NAME: 'auth-server' }));

    await expect(
      client.publish('user.registered', { userId: 1 }),
    ).resolves.toBeUndefined();

    expect(repo.insert).toHaveBeenCalledTimes(1);
    const row: EventOutboxEntity = repo.insert.mock.calls[0][0];
    expect(row.pattern).toBe('user.registered');
    expect(row.payload).toEqual({ userId: 1 });
    expect(row.source).toBe('auth-server');
  });

  it('swallows a failed self-insert (fire-and-forget contract)', async () => {
    const repo = makeRepo();
    repo.insert.mockRejectedValueOnce(new Error('db down'));
    const client = new OutboxEventClient(repo, config());

    await expect(client.publish('p', {})).resolves.toBeUndefined();
  });

  it('writes through the caller manager and propagates its errors', async () => {
    const repo = makeRepo();
    const managerInsert = jest.fn().mockResolvedValue(undefined);
    const manager = { getRepository: jest.fn().mockReturnValue({ insert: managerInsert }) } as any;
    const client = new OutboxEventClient(repo, config());

    await client.publish('p', { a: 1 }, { manager });
    expect(managerInsert).toHaveBeenCalledTimes(1);
    expect(repo.insert).not.toHaveBeenCalled();

    managerInsert.mockRejectedValueOnce(new Error('rollback'));
    await expect(client.publish('p', {}, { manager })).rejects.toThrow('rollback');
  });
});

describe('OutboxRelayWorker', () => {
  const makeJob = (over: Partial<EventOutboxEntity> = {}): EventOutboxEntity =>
    ({
      id: 7,
      pattern: 'user.registered',
      payload: { userId: 1 },
      source: 'auth-server',
      opts: null,
      ...over,
    }) as any;

  it('posts the envelope to event-server with the internal api key', async () => {
    const worker = new OutboxRelayWorker(makeRepo(), config({
      EVENT_SERVER_URL: 'http://event-server:3005',
      INTERNAL_API_KEY: 'secret',
    }));
    const postSpy = jest.spyOn(httpHelper, 'httpPost').mockResolvedValue({
      status: 201,
      ok: true,
      data: {},
    } as any);

    await expect(
      (worker as any).process(makeJob()),
    ).resolves.toBeUndefined();
    expect(postSpy).toHaveBeenCalledWith(
      'http://event-server:3005/events',
      buildEventEnvelope('user.registered', { userId: 1 }, 'auth-server', null),
      { headers: { 'X-Internal-Api-Key': 'secret' }, timeout: 5000 },
    );
    postSpy.mockRestore();
  });

  it('lets http failures bubble up so QueueWorker applies backoff', async () => {
    const worker = new OutboxRelayWorker(makeRepo(), config());
    const postSpy = jest
      .spyOn(httpHelper, 'httpPost')
      .mockRejectedValue(new HttpError(503, {}, 'HTTP 503'));

    await expect(
      (worker as any).process(makeJob()),
    ).rejects.toBeInstanceOf(HttpError);
    postSpy.mockRestore();
  });
});
