import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { ACCESS_RULES_METADATA, AccessGuard } from '../common/guard/access.guard';
import { AccessRule } from '../common/access.rules';
import { Reflector } from '@nestjs/core';

const rules: AccessRule[] = [{ who: ['moderator'] }];

function createContext(user: any, metadata?: AccessRule[]) {
  const request: any = { user };
  const reflector = {
    get: jest.fn().mockReturnValue(metadata),
  } as unknown as Reflector;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => {},
  } as any;
  return { guard: new AccessGuard(reflector), context, request };
}

describe('AccessGuard', () => {
  it('allows when no rules metadata', () => {
    const { guard, context } = createContext(undefined, undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows empty rules', () => {
    const { guard, context } = createContext(undefined, []);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('superuser passes without matching', () => {
    const { guard, context, request } = createContext({ id: 1, isSuperuser: true }, rules);
    expect(guard.canActivate(context)).toBe(true);
    expect(request.accessRule).toBeUndefined();
  });

  it('rejects when no rule matches', () => {
    const { guard, context } = createContext({ id: 1, roles: ['student'] }, rules);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects anonymous user', () => {
    const { guard, context } = createContext(undefined, rules);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('stores matched rule on request', () => {
    const { guard, context, request } = createContext({ id: 1, roles: ['moderator'] }, rules);
    expect(guard.canActivate(context)).toBe(true);
    expect(request.accessRule?.rule).toBe(rules[0]);
  });

  it('metadata key is stable', () => {
    expect(ACCESS_RULES_METADATA).toBe('access-rules');
  });
});
