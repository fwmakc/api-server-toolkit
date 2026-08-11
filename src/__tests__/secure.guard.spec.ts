import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { SecureGuard } from '../common/guard/secure.guard';

jest.mock('../common/guard/secure.guard.service', () => ({
  tokenValidate: jest.fn(),
}));

import { tokenValidate } from '../common/guard/secure.guard.service';

describe('SecureGuard', () => {
  let guard: SecureGuard;

  function mockContext(headers: Record<string, string>): ExecutionContext {
    const request = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
  }

  beforeEach(() => {
    guard = new SecureGuard();
  });

  it('returns true when tokenValidate returns true', () => {
    (tokenValidate as jest.Mock).mockReturnValue(true);
    const ctx = mockContext({ authorization: 'valid-token' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns false when tokenValidate returns false', () => {
    (tokenValidate as jest.Mock).mockReturnValue(false);
    const ctx = mockContext({ authorization: 'invalid-token' });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('passes authorization header to tokenValidate', () => {
    (tokenValidate as jest.Mock).mockReturnValue(true);
    const ctx = mockContext({ authorization: 'my-token' });
    guard.canActivate(ctx);
    expect(tokenValidate).toHaveBeenCalledWith('my-token');
  });

  it('passes undefined to tokenValidate when no authorization header', () => {
    (tokenValidate as jest.Mock).mockReturnValue(false);
    const ctx = mockContext({});
    guard.canActivate(ctx);
    expect(tokenValidate).toHaveBeenCalledWith(undefined);
  });
});
