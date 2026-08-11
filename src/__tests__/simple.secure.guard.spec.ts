import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { SimpleSecureGuard } from '../common/guard/simple.secure.guard';

jest.mock('../common/guard/secure.guard.service', () => ({
  tokenValidateSimple: jest.fn(),
}));

import { tokenValidateSimple } from '../common/guard/secure.guard.service';

describe('SimpleSecureGuard', () => {
  let guard: SimpleSecureGuard;

  function mockContext(headers: Record<string, string>): ExecutionContext {
    const request = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
  }

  beforeEach(() => {
    guard = new SimpleSecureGuard();
  });

  it('returns true when tokenValidateSimple returns true', () => {
    (tokenValidateSimple as jest.Mock).mockReturnValue(true);
    const ctx = mockContext({ authorization: 'valid-token' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns false when tokenValidateSimple returns false', () => {
    (tokenValidateSimple as jest.Mock).mockReturnValue(false);
    const ctx = mockContext({ authorization: 'invalid-token' });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('passes authorization header to tokenValidateSimple', () => {
    (tokenValidateSimple as jest.Mock).mockReturnValue(true);
    const ctx = mockContext({ authorization: 'my-token' });
    guard.canActivate(ctx);
    expect(tokenValidateSimple).toHaveBeenCalledWith('my-token');
  });

  it('passes undefined when no authorization header', () => {
    (tokenValidateSimple as jest.Mock).mockReturnValue(false);
    const ctx = mockContext({});
    guard.canActivate(ctx);
    expect(tokenValidateSimple).toHaveBeenCalledWith(undefined);
  });
});
