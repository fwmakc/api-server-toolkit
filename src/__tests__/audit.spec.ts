import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { ACCESS_RULES_METADATA, AccessGuard } from '../common/guard/access.guard';
import { AccessRule } from '../common/access.rules';
import { AuditInterceptor } from '../common/audit/audit.interceptor';
import { AuditService } from '../common/audit/audit.service';
import { IEventClient } from '../common/client/event-client.interfaces';

const rules: AccessRule[] = [{ who: ['moderator'] }];

describe('AuditService', () => {
  it('publishes audit.event with the payload and coerces ids', () => {
    const client = { publish: jest.fn().mockResolvedValue(undefined) } as unknown as IEventClient;
    const audit = new AuditService(client);

    audit.log({
      action: 'auth.login.failed',
      outcome: 'failure',
      accountId: '77',
      targetId: 9,
      details: { reason: 'bad password' },
    });

    expect(client.publish).toHaveBeenCalledTimes(1);
    const [pattern, payload] = (client.publish as jest.Mock).mock.calls[0];
    expect(pattern).toBe('audit.event');
    expect(payload).toMatchObject({
      action: 'auth.login.failed',
      outcome: 'failure',
      accountId: 77,
      targetId: '9',
      details: { reason: 'bad password' },
    });
    expect('tenantId' in (payload as object)).toBe(false);
  });

  it('falls back to the structured log without an event client', () => {
    const audit = new AuditService(undefined);
    const spy = jest.spyOn((audit as any).logger, 'log').mockImplementation(() => {});

    audit.log({ action: 'access.denied', outcome: 'deny', requestId: 'r-1' });

    expect(spy).toHaveBeenCalledTimes(1);
    const [line] = spy.mock.calls[0];
    expect(line).toContain('"action":"access.denied"');
    expect(line).toContain('"requestId":"r-1"');
  });

  it('never rejects the caller when publish fails', () => {
    const client = { publish: jest.fn().mockRejectedValue(new Error('bus down')) } as unknown as IEventClient;
    const audit = new AuditService(client);
    expect(() => audit.log({ action: 'auth.login.success', accountId: 1 })).not.toThrow();
  });
});

describe('AccessGuard audit hook', () => {
  function createContext(user: any) {
    const request: any = {
      user,
      method: 'GET',
      headers: { 'user-agent': 'jest' },
      url: '/things',
      route: { path: '/things' },
    };
    const reflector = { get: jest.fn().mockReturnValue(rules) } as unknown as Reflector;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => () => {},
    } as any;
    return { context, request, reflector };
  }

  it('publishes access.denied with account info on 403', () => {
    const audit = { log: jest.fn() } as any;
    const { context } = createContext({ id: 3, username: 'u@test.local', tenantId: 2, roles: ['student'] });
    const guard = new (AccessGuard as any)(createReflector(), audit);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(audit.log).toHaveBeenCalledTimes(1);
    const [entry] = audit.log.mock.calls[0];
    expect(entry).toMatchObject({
      action: 'access.denied',
      outcome: 'deny',
      accountId: 3,
      accountUsername: 'u@test.local',
      tenantId: 2,
      targetType: 'route',
      targetId: '/things',
    });
    expect(entry.details.roles).toEqual(['student']);
  });

  it('does not audit an allowed request', () => {
    const audit = { log: jest.fn() } as any;
    const { context } = createContext({ id: 3, roles: ['moderator'] });
    const guard = new (AccessGuard as any)(createReflector(), audit);
    expect(guard.canActivate(context)).toBe(true);
    expect(audit.log).not.toHaveBeenCalled();
  });

  function createReflector() {
    return { get: jest.fn().mockReturnValue(rules) } as unknown as Reflector;
  }
});

describe('AuditInterceptor', () => {
  const audit = { log: jest.fn() } as any;
  const interceptor = new AuditInterceptor(audit);

  function run(method: string, handlerData: any, statusCode = 201) {
    const request: any = {
      method,
      headers: { 'user-agent': 'jest' },
      url: '/things',
      route: { path: '/things' },
      user: { id: 5, username: 'u@test.local', tenantId: 1 },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ statusCode }),
      }),
    } as any;
    return lastValueFrom(interceptor.intercept(context, { handle: () => of(handlerData) } as any));
  }

  beforeEach(() => audit.log.mockClear());

  it('audits a successful POST as data.created', async () => {
    await run('POST', { id: 9 });
    expect(audit.log).toHaveBeenCalledTimes(1);
    const [entry] = audit.log.mock.calls[0];
    expect(entry).toMatchObject({
      action: 'data.created',
      outcome: 'success',
      accountId: 5,
      targetId: '/things',
    });
    expect(entry.details).toMatchObject({ method: 'POST', status: 201, resourceId: '9' });
  });

  it('audits DELETE as data.deleted without resource id', async () => {
    await run('DELETE', true, 200);
    const [entry] = audit.log.mock.calls[0];
    expect(entry.action).toBe('data.deleted');
    expect(entry.details.resourceId).toBeUndefined();
  });

  it('skips GET requests', async () => {
    await run('GET', []);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('skips error responses', async () => {
    await run('POST', undefined, 500);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('metadata key is stable', () => {
    expect(ACCESS_RULES_METADATA).toBe('access-rules');
  });
});
