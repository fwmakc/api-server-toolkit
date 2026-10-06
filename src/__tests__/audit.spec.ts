import 'reflect-metadata';
import { ForbiddenException, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { ACCESS_RULES_METADATA, AccessGuard } from '../common/guard/access.guard';
import { AccessRule } from '../common/access.rules';
import { AuditInterceptor } from '../common/audit/audit.interceptor';
import { AuditModule } from '../common/audit/audit.module';
import { auditActionMatches, AuditService } from '../common/audit/audit.service';
import { MetricsService } from '../common/metrics/metrics.service';
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
    const [pattern, payload, options] = (client.publish as jest.Mock).mock.calls[0];
    expect(pattern).toBe('audit.event');
    // journal 14: audit noise claims at the lowest rank so a sustained
    // audit flood cannot starve operational deliveries behind the FIFO
    expect(options).toMatchObject({ priority: 'low' });
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

  it('AuditModule wiring: AuditService resolves the event client from EventClientModule', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule.forRoot()],
    }).compile();
    const audit = moduleRef.get(AuditService);
    expect((audit as any).client).toBeDefined();
  });

  it('AuditModule wiring: client: false with a custom imports module is honored', async () => {
    @Module({
      providers: [{ provide: IEventClient, useValue: { publish: jest.fn() } }],
      exports: [IEventClient],
    })
    class CustomClientModule {}
    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule.forRoot({ client: false, imports: [CustomClientModule] })],
    }).compile();
    const audit = moduleRef.get(AuditService);
    expect((audit as any).client).toBeDefined();
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

describe('AuditFilter — enabled/include/exclude', () => {
  const makeClient = () =>
    ({ publish: jest.fn().mockResolvedValue(undefined) } as unknown as IEventClient);

  it('auditActionMatches: dot-boundary prefixes', () => {
    expect(auditActionMatches('auth.login.failed', 'auth')).toBe(true);
    expect(auditActionMatches('auth', 'auth')).toBe(true);
    expect(auditActionMatches('audit.event', 'auth')).toBe(false);
    expect(auditActionMatches('author.x', 'auth')).toBe(false);
    expect(auditActionMatches('data.deleted', 'data.deleted')).toBe(true);
    expect(auditActionMatches('data.created', 'data.deleted')).toBe(false);
    expect(auditActionMatches('auth.login.failed', 'auth.login.')).toBe(true);
  });

  it('exclude drops matching actions before publishing', () => {
    const client = makeClient();
    const audit = new AuditService(client, { exclude: ['data.updated'] });

    audit.log({ action: 'data.updated', targetType: 'route' });
    audit.log({ action: 'data.deleted' });

    expect(client.publish).toHaveBeenCalledTimes(1);
    const [, payload] = (client.publish as jest.Mock).mock.calls[0];
    expect(payload).toMatchObject({ action: 'data.deleted' });
  });

  it('include keeps only listed prefixes (and their subtrees)', () => {
    const client = makeClient();
    const audit = new AuditService(client, { include: ['access.', 'auth'] });

    audit.log({ action: 'access.denied' });
    audit.log({ action: 'auth.login.success' });
    audit.log({ action: 'data.created' });

    expect(client.publish).toHaveBeenCalledTimes(2);
  });

  it('exclude wins after include', () => {
    const client = makeClient();
    const audit = new AuditService(client, { include: ['data.'], exclude: ['data.created'] });

    audit.log({ action: 'data.created' });
    audit.log({ action: 'data.deleted' });

    expect(client.publish).toHaveBeenCalledTimes(1);
    const [, payload] = (client.publish as jest.Mock).mock.calls[0];
    expect(payload).toMatchObject({ action: 'data.deleted' });
  });

  it('AUDIT_ENABLED=false is a full kill switch (env fallback)', () => {
    process.env.AUDIT_ENABLED = 'false';
    try {
      const client = makeClient();
      const audit = new AuditService(client);
      audit.log({ action: 'access.denied' });
      expect(client.publish).not.toHaveBeenCalled();
    } finally {
      delete process.env.AUDIT_ENABLED;
    }
  });

  it('explicit options win over env', () => {
    process.env.AUDIT_EXCLUDE = 'data.updated';
    try {
      const client = makeClient();
      const audit = new AuditService(client, { exclude: [] });
      audit.log({ action: 'data.updated' });
      expect(client.publish).toHaveBeenCalledTimes(1);
    } finally {
      delete process.env.AUDIT_EXCLUDE;
    }
  });

  it('filtered entries do not even hit the log fallback', () => {
    const audit = new AuditService(undefined, { exclude: ['data.updated'] });
    const spy = jest.spyOn((audit as any).logger, 'log').mockImplementation(() => {});

    audit.log({ action: 'data.updated' });

    expect(spy).not.toHaveBeenCalled();
  });

  it('wiring: forRoot({ filter }) reaches the service', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule.forRoot({ filter: { exclude: ['data.updated'] } })],
    }).compile();
    const audit = moduleRef.get(AuditService);
    expect((audit as any).filter.exclude).toEqual(['data.updated']);
    // excluded action must be dropped before the (real, HTTP) client is hit
    expect(() => audit.log({ action: 'data.updated' })).not.toThrow();
  });

  it('wiring: env AUDIT_INCLUDE fills unset forRoot fields', async () => {
    process.env.AUDIT_INCLUDE = 'auth.,access.';
    try {
      const moduleRef = await Test.createTestingModule({
        imports: [AuditModule.forRoot()],
      }).compile();
      const audit = moduleRef.get(AuditService);
      expect((audit as any).filter.include).toEqual(['auth.', 'access.']);
    } finally {
      delete process.env.AUDIT_INCLUDE;
    }
  });

  it('counts passed/filtered entries in the metrics registry', async () => {
    const metrics = new MetricsService({ service: 'audit-spec' });
    const audit = new AuditService(makeClient(), { exclude: ['data.updated'] }, metrics);

    audit.log({ action: 'data.updated' });
    audit.log({ action: 'data.deleted' });
    audit.log({ action: 'data.deleted' });

    const { values } = await (metrics.registry.getSingleMetric('audit_events_total') as any).get();
    expect(values.find((v: any) => v.labels.result === 'filtered')?.value).toBe(1);
    expect(values.find((v: any) => v.labels.result === 'passed')?.value).toBe(2);
  });

  it('a second service on the same registry does not double-register', () => {
    const metrics = new MetricsService({ service: 'audit-spec-2' });
    expect(() => new AuditService(makeClient(), {}, metrics)).not.toThrow();
    expect(() => new AuditService(makeClient(), {}, metrics)).not.toThrow();
  });

  it('kill switch shows up as the disabled counter result', async () => {
    const metrics = new MetricsService({ service: 'audit-spec-3' });
    const audit = new AuditService(makeClient(), { enabled: false }, metrics);

    audit.log({ action: 'access.denied' });

    const { values } = await (metrics.registry.getSingleMetric('audit_events_total') as any).get();
    expect(values.find((v: any) => v.labels.result === 'disabled')?.value).toBe(1);
  });
});
