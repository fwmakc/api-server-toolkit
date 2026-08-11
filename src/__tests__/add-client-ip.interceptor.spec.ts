import 'reflect-metadata';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AddClientIpInterceptor } from '../common/interceptor/add-client-ip.interceptor';

jest.mock('@supercharge/request-ip', () => ({
  getClientIp: jest.fn().mockReturnValue('1.2.3.4'),
}));

import { getClientIp } from '@supercharge/request-ip';

describe('AddClientIpInterceptor', () => {
  let interceptor: AddClientIpInterceptor;

  function mockContext(body: Record<string, unknown> = {}): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ body }),
      }),
    } as any;
  }

  beforeEach(() => {
    interceptor = new AddClientIpInterceptor();
    (getClientIp as jest.Mock).mockReturnValue('1.2.3.4');
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

  it('calls getClientIp with request', () => {
    const body: Record<string, unknown> = {};
    const ctx = mockContext(body);
    const req = ctx.switchToHttp().getRequest();
    const next: CallHandler = { handle: () => of('result') } as any;

    interceptor.intercept(ctx, next).subscribe();

    expect(getClientIp).toHaveBeenCalledWith(req);
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
