import 'reflect-metadata';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { RemovePrivateFieldsInterceptor } from '../common/interceptor/remove-private.interceptor';

jest.mock('../common/service/admin.service', () => ({
  isSuperuser: jest.fn(),
}));

jest.mock('../common/service/owner.service', () => ({
  OWNER_TABLE: 'account',
}));

jest.mock('../common/service/tenant.service', () => ({
  TENANT_TABLE: undefined,
  TENANT_FIELD: 'id',
}));

jest.mock('../common/service/private_fields.service', () => ({
  removePrivateFields: jest.fn((result) => result),
}));

import { removePrivateFields } from '../common/service/private_fields.service';
import { isSuperuser } from '../common/service/admin.service';

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

  it('calls removePrivateFields for object results', async () => {
    const user = { id: 1, isSuperuser: false };
    (isSuperuser as jest.Mock).mockReturnValue(false);
    const ctx = mockContext(user);
    const data = { name: 'Test' };
    const next: CallHandler = { handle: () => of(data) } as any;
    await lastValueFrom(interceptor.intercept(ctx, next));
    expect(removePrivateFields).toHaveBeenCalledWith(data, expect.any(Object), user);
  });

  it('passes bind with allow=true when user is superuser', async () => {
    const user = { id: 1, isSuperuser: true };
    (isSuperuser as jest.Mock).mockReturnValue(true);
    const ctx = mockContext(user);
    const data = { name: 'Test' };
    const next: CallHandler = { handle: () => of(data) } as any;
    await lastValueFrom(interceptor.intercept(ctx, next));
    const bind = (removePrivateFields as jest.Mock).mock.calls[0][1];
    expect(bind.allow).toBe(true);
  });

  it('passes bind with allow=false for normal user', async () => {
    const user = { id: 1, isSuperuser: false };
    (isSuperuser as jest.Mock).mockReturnValue(false);
    const ctx = mockContext(user);
    const data = { name: 'Test' };
    const next: CallHandler = { handle: () => of(data) } as any;
    await lastValueFrom(interceptor.intercept(ctx, next));
    const bind = (removePrivateFields as jest.Mock).mock.calls[0][1];
    expect(bind.allow).toBe(false);
    expect(bind.id).toBe(1);
  });

  it('handles missing user with allow=false and undefined id', async () => {
    (isSuperuser as jest.Mock).mockReturnValue(false);
    const ctx = mockContext(undefined);
    const data = { name: 'Test' };
    const next: CallHandler = { handle: () => of(data) } as any;
    await lastValueFrom(interceptor.intercept(ctx, next));
    const bind = (removePrivateFields as jest.Mock).mock.calls[0][1];
    expect(bind.allow).toBe(false);
    expect(bind.id).toBeUndefined();
  });
});
