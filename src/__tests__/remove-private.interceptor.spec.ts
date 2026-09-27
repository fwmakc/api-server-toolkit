import 'reflect-metadata';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { RemovePrivateFieldsInterceptor } from '../common/interceptor/remove-private.interceptor';

jest.mock('../common/service/private_fields.service', () => ({
  removePrivateFields: jest.fn((result) => result),
}));

import { removePrivateFields } from '../common/service/private_fields.service';

describe('RemovePrivateFieldsInterceptor', () => {
  let interceptor: RemovePrivateFieldsInterceptor;

  function mockContext(user?: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  beforeEach(() => {
    interceptor = new RemovePrivateFieldsInterceptor();
    (removePrivateFields as jest.Mock).mockClear();
  });

  it('returns non-object values unchanged', async () => {
    const ctx = mockContext({ id: 1 });
    const next: CallHandler = { handle: () => of(null) } as any;
    const result = await lastValueFrom(interceptor.intercept(ctx, next));
    expect(result).toBeNull();
    expect(removePrivateFields).not.toHaveBeenCalled();
  });

  it('returns undefined unchanged', async () => {
    const ctx = mockContext({ id: 1 });
    const next: CallHandler = { handle: () => of(undefined) } as any;
    const result = await lastValueFrom(interceptor.intercept(ctx, next));
    expect(result).toBeUndefined();
  });

  it('returns number unchanged', async () => {
    const ctx = mockContext({ id: 1 });
    const next: CallHandler = { handle: () => of(42) } as any;
    const result = await lastValueFrom(interceptor.intercept(ctx, next));
    expect(result).toBe(42);
  });

  it('calls removePrivateFields with the request user', async () => {
    const user = { id: 1, roles: ['student'] };
    const ctx = mockContext(user);
    const data = { name: 'Test' };
    const next: CallHandler = { handle: () => of(data) } as any;
    await lastValueFrom(interceptor.intercept(ctx, next));
    expect(removePrivateFields).toHaveBeenCalledWith(data, user);
  });

  it('passes undefined account when no user', async () => {
    const ctx = mockContext(undefined);
    const data = { name: 'Test' };
    const next: CallHandler = { handle: () => of(data) } as any;
    await lastValueFrom(interceptor.intercept(ctx, next));
    expect(removePrivateFields).toHaveBeenCalledWith(data, undefined);
  });
});
