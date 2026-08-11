import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, ROLES_METADATA } from '../common/guard/roles.guard';

function createMockContext(user?: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => {},
    getClass: () => {},
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({} as any),
    switchToWs: () => ({} as any),
    getType: () => 'http' as any,
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { get: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('returns true when no requiredRoles set (undefined)', () => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);
    const result = guard.canActivate(createMockContext({}));
    expect(result).toBe(true);
  });

  it('returns true when requiredRoles is empty array', () => {
    (reflector.get as jest.Mock).mockReturnValue([]);
    const result = guard.canActivate(createMockContext({}));
    expect(result).toBe(true);
  });

  it('returns false when no user in request', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const result = guard.canActivate(createMockContext(undefined));
    expect(result).toBe(false);
  });

  it('throws ForbiddenException when user has no roles', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    expect(() =>
      guard.canActivate(createMockContext({ roles: [] })),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has roles but none match', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    expect(() =>
      guard.canActivate(createMockContext({ roles: ['editor'] })),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user.roles is undefined', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    expect(() =>
      guard.canActivate(createMockContext({})),
    ).toThrow(ForbiddenException);
  });

  it('returns true when user role matches required', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const result = guard.canActivate(createMockContext({ roles: ['admin'] }));
    expect(result).toBe(true);
  });

  it('returns true when user has one of multiple required roles', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin', 'editor']);
    const result = guard.canActivate(createMockContext({ roles: ['editor'] }));
    expect(result).toBe(true);
  });

  it('returns true when user has multiple roles and one matches', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const result = guard.canActivate(
      createMockContext({ roles: ['viewer', 'editor', 'admin'] }),
    );
    expect(result).toBe(true);
  });

  it('bypasses role check for superuser (isSuperuser=true)', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const result = guard.canActivate(
      createMockContext({ isSuperuser: true, roles: [] }),
    );
    expect(result).toBe(true);
  });

  it('bypasses role check for superuser even with empty roles', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const result = guard.canActivate(
      createMockContext({ isSuperuser: true }),
    );
    expect(result).toBe(true);
  });

  it('ForbiddenException has correct message', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    try {
      guard.canActivate(createMockContext({ roles: [] }));
      fail('should have thrown');
    } catch (e) {
      expect((e as ForbiddenException).message).toBe(
        'Insufficient role permissions',
      );
    }
  });

  it('calls reflector.get with correct metadata key', () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const ctx = createMockContext({ roles: ['admin'] });
    guard.canActivate(ctx);
    expect(reflector.get).toHaveBeenCalledWith(ROLES_METADATA, ctx.getHandler());
  });
});
