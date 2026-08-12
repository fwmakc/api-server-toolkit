import 'reflect-metadata';

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockReturnValue({ log: jest.fn() }),
}));

import { bootstrap } from '../common/bootstrap/bootstrap.service';

describe('bootstrap (thin)', () => {
  let mockApp: { listen: jest.Mock; close: jest.Mock };
  let origPort: string | undefined;
  let origNodeEnv: string | undefined;

  beforeEach(() => {
    mockApp = { listen: jest.fn().mockResolvedValue(undefined), close: jest.fn() };
    origPort = process.env.PORT;
    origNodeEnv = process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    if (origPort !== undefined) process.env.PORT = origPort;
    else delete process.env.PORT;
    if (origNodeEnv !== undefined) process.env.NODE_ENV = origNodeEnv;
    else delete process.env.NODE_ENV;
    process.removeAllListeners('SIGINT');
  });

  it('calls app.listen with PORT env and localhost', async () => {
    process.env.PORT = '3000';
    await bootstrap(mockApp as any);
    expect(mockApp.listen).toHaveBeenCalledWith('3000', 'localhost');
  });

  it('calls app.listen with custom port and ip from options', async () => {
    await bootstrap(mockApp as any, { port: 5000, ip: '0.0.0.0' });
    expect(mockApp.listen).toHaveBeenCalledWith(5000, '0.0.0.0');
  });

  it('sets up process.on SIGINT handler that calls app.close', async () => {
    await bootstrap(mockApp as any, { port: 3000 });
    const listeners = process.listeners('SIGINT');
    expect(listeners.length).toBe(1);
    (listeners[0] as Function)();
    expect(mockApp.close).toHaveBeenCalled();
  });

  it('logs startup message', async () => {
    const { Logger } = require('@nestjs/common');
    const mockLogger = new Logger();
    await bootstrap(mockApp as any, { port: 4000 });
    expect(Logger).toHaveBeenCalledWith('Bootstrap');
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('4000'),
    );
  });
});
