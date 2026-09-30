import 'reflect-metadata';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AddClientIpInterceptor } from '../common/interceptor/add-client-ip.interceptor';

describe('AddClientIpInterceptor', () => {
  let interceptor: AddClientIpInterceptor;

  function mockContext(body: Record<string, unknown> = {}): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ body, ip: '1.2.3.4' }),
      }),
    } as any;
  }

  beforeEach(() => {
    interceptor = new AddClientIpInterceptor();
  });

  it('adds client IP to request body with default key "ip"', () => {
    const body: Record<string, unknown> = {};
    const ctx = mockContext(body);
    const next: CallHandler = { handle: () => of('result') } as any;

    interceptor.intercept(ctx, next).subscribe();

    expect(body.ip).toBe('1.2.3.4');
  });

  it('uses custom key when provided', () => {
    const body: Record<string, unknown> = {};
    const ctx = mockContext(body);
    const next: CallHandler = { handle: () => of('result') } as any;

    const customInterceptor = new AddClientIpInterceptor('clientIp');
    customInterceptor.intercept(ctx, next).subscribe();

    expect(body.clientIp).toBe('1.2.3.4');
  });

  it('overwrites existing body key with IP', () => {
    const body: Record<string, unknown> = { ip: 'old-value' };
    const ctx = mockContext(body);
    const next: CallHandler = { handle: () => of('result') } as any;

    interceptor.intercept(ctx, next).subscribe();

    expect(body.ip).toBe('1.2.3.4');
  });

  it('falls back to socket address when req.ip is absent', () => {
    const body: Record<string, unknown> = {};
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ body, socket: { remoteAddress: '10.0.0.9' } }),
      }),
    } as any;
    const next: CallHandler = { handle: () => of('result') } as any;

    new AddClientIpInterceptor().intercept(ctx, next).subscribe();

    expect(body.ip).toBe('10.0.0.9');
  });

  it('passes through the observable', (done) => {
    const ctx = mockContext({});
    const next: CallHandler = { handle: () => of('payload') } as any;

    interceptor.intercept(ctx, next).subscribe({
      next: (val) => {
        expect(val).toBe('payload');
        done();
      },
    });
  });
});
