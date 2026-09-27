import 'reflect-metadata';
import {
  AccessRule,
  accessBind,
  anonymousAccount,
  compileRuleToBind,
  isPublicRules,
  matchRule,
  matchWho,
  normalizeAccount,
  parseAccessPath,
  PUBLIC_ROLE,
  AUTHENTICATED_ROLE,
} from '../common/access.rules';
import { BindDto } from '../common/dto/bind.dto';

const user = (props: any = {}) => ({ id: 1, ...props });

describe('access.rules', () => {
  describe('normalizeAccount / anonymousAccount', () => {
    it('adds authenticated pseudo-role to a real account', () => {
      const result = normalizeAccount(user({ roles: ['moderator'] }));
      expect(result?.roles).toContain('moderator');
      expect(result?.roles).toContain(AUTHENTICATED_ROLE);
    });

    it('does not duplicate authenticated role', () => {
      const result = normalizeAccount(user({ roles: [AUTHENTICATED_ROLE] }));
      expect(result?.roles?.filter((r) => r === AUTHENTICATED_ROLE)).toHaveLength(1);
    });

    it('handles account without roles', () => {
      const result = normalizeAccount(user());
      expect(result?.roles).toEqual([AUTHENTICATED_ROLE]);
    });

    it('returns undefined for empty input', () => {
      expect(normalizeAccount(undefined)).toBeUndefined();
      expect(normalizeAccount(null)).toBeUndefined();
    });

    it('anonymous account has only public role', () => {
      expect(anonymousAccount().roles).toEqual([PUBLIC_ROLE]);
    });
  });

  describe('matchRule', () => {
    it('defaults who to authenticated', () => {
      const rules: AccessRule[] = [{}];
      expect(matchRule(rules, user({ roles: ['editor'] }))).toBeDefined();
      expect(matchRule(rules, anonymousAccount())).toBeUndefined();
    });

    it('public rule matches only anonymous', () => {
      const rules: AccessRule[] = [{ who: [PUBLIC_ROLE] }];
      expect(matchRule(rules, anonymousAccount())).toBeDefined();
      expect(matchRule(rules, user({ roles: ['moderator'] }))).toBeUndefined();
    });

    it('first matching rule wins', () => {
      const rules: AccessRule[] = [
        { who: ['moderator'] },
        { who: [AUTHENTICATED_ROLE], scope: { owner: 'author.id' } },
      ];
      const matched = matchRule(rules, user({ roles: ['moderator'] }));
      expect(matched?.rule).toBe(rules[0]);
    });

    it('falls through to later rules', () => {
      const rules: AccessRule[] = [
        { who: ['moderator'] },
        { who: [AUTHENTICATED_ROLE], scope: { owner: 'author.id' } },
      ];
      const matched = matchRule(rules, user({ roles: ['student'] }));
      expect(matched?.rule).toBe(rules[1]);
    });

    it('returns undefined when nothing matches', () => {
      expect(matchRule([{ who: ['moderator'] }], user({ roles: ['student'] }))).toBeUndefined();
      expect(matchRule(undefined, user())).toBeUndefined();
      expect(matchRule([], user())).toBeUndefined();
    });

    it('widens scope to all for matched role with tenant all', () => {
      const rules: AccessRule[] = [
        { who: ['moderator'], scope: { tenant: 'tenant.id' } },
      ];
      const moderatorAll = user({
        roles: ['moderator'],
        roleEntries: [{ role: 'moderator', tenant: 'all' }],
      });
      expect(matchRule(rules, moderatorAll)?.scope).toBe('all');
    });

    it('does not widen when tenant-all role is not matched', () => {
      const rules: AccessRule[] = [
        { who: [AUTHENTICATED_ROLE], scope: { tenant: 'tenant.id' } },
      ];
      const account = user({
        roles: ['student'],
        roleEntries: [{ role: 'moderator', tenant: 'all' }],
      });
      expect(matchRule(rules, account)?.scope).toEqual({ tenant: 'tenant.id' });
    });
  });

  describe('parseAccessPath', () => {
    it('splits dotted path', () => {
      expect(parseAccessPath('author.id')).toEqual({ name: 'author', key: 'id' });
    });

    it('splits multi-hop path', () => {
      expect(parseAccessPath('enrolls.student.id')).toEqual({
        name: 'enrolls.student',
        key: 'id',
      });
    });

    it('single segment is relation with id key', () => {
      expect(parseAccessPath('author')).toEqual({ name: 'author', key: 'id' });
    });

    it('special value id means own id column', () => {
      expect(parseAccessPath('id')).toEqual({ name: '', key: 'id' });
    });
  });

  describe('compileRuleToBind', () => {
    const matched = (rule: AccessRule, roles: string[] = [AUTHENTICATED_ROLE]) =>
      matchRule([rule], user({ roles }));

    it('superuser gets allow bind', () => {
      const m = matched({ who: ['moderator'], scope: { owner: 'author.id' } }, ['moderator']);
      const bind = compileRuleToBind(m, user({ roles: ['moderator'], isSuperuser: true }));
      expect(bind?.allow).toBe(true);
    });

    it('scope all produces no bind (no filter)', () => {
      const bind = compileRuleToBind(matched({}), user({ roles: [] }));
      expect(bind).toBeUndefined();
    });

    it('no match produces no bind', () => {
      expect(compileRuleToBind(undefined, user())).toBeUndefined();
    });

    it('owner scope compiles to relation bind', () => {
      const bind = compileRuleToBind(matched({ scope: { owner: 'author.id' } }), user({ id: 42 }));
      expect(bind).toEqual({ id: 42, key: 'id', name: 'author', roles: [AUTHENTICATED_ROLE] } as Partial<BindDto>);
    });

    it('multi-hop owner scope keeps full path', () => {
      const bind = compileRuleToBind(matched({ scope: { owner: 'enrolls.student.id' } }), user({ id: 42 }));
      expect(bind?.name).toBe('enrolls.student');
      expect(bind?.key).toBe('id');
    });

    it('owner id compiles to own id column', () => {
      const bind = compileRuleToBind(matched({ scope: { owner: 'id' } }), user({ id: 42 }));
      expect(bind?.id).toBe(42);
      expect(bind?.name).toBeUndefined();
      expect(bind?.key).toBe('id');
    });

    it('tenant scope compiles to tenant bind', () => {
      const bind = compileRuleToBind(
        matched({ scope: { tenant: 'tenant.id' } }),
        user({ roles: [], tenantId: 7 }),
      );
      expect(bind?.tenantName).toBe('tenant');
      expect(bind?.tenantKey).toBe('id');
      expect(bind?.tenantId).toBe(7);
    });

    it('widened scope compiles like all', () => {
      const m = matchRule(
        [{ who: ['moderator'], scope: { owner: 'author.id' } }],
        user({ roles: ['moderator'], roleEntries: [{ role: 'moderator', tenant: 'all' }] }),
      );
      expect(compileRuleToBind(m, user({ roles: ['moderator'] }))).toBeUndefined();
    });
  });

  describe('accessBind', () => {
    it('combines match and compile', () => {
      const bind = accessBind([{ who: [AUTHENTICATED_ROLE], scope: { owner: 'author.id' } }], user({ id: 9 }));
      expect(bind?.id).toBe(9);
      expect(bind?.name).toBe('author');
    });
  });

  describe('matchWho (fields)', () => {
    it('no rules means visible', () => {
      expect(matchWho(undefined, user({ roles: [] }))).toBe(true);
    });

    it('checks roles across rules', () => {
      const rules: AccessRule[] = [{ who: ['accountant'] }];
      expect(matchWho(rules, user({ roles: ['accountant'] }))).toBe(true);
      expect(matchWho(rules, user({ roles: ['student'] }))).toBe(false);
    });

    it('anonymous does not match authenticated-only field', () => {
      expect(matchWho([{}], anonymousAccount())).toBe(false);
    });
  });

  describe('isPublicRules', () => {
    it('true when any rule allows public (JWT optional)', () => {
      expect(isPublicRules([{ who: [PUBLIC_ROLE] }])).toBe(true);
      expect(
        isPublicRules([{ who: [PUBLIC_ROLE] }, { who: [AUTHENTICATED_ROLE] }]),
      ).toBe(true);
    });

    it('false otherwise', () => {
      expect(isPublicRules([{ who: [AUTHENTICATED_ROLE] }])).toBe(false);
      expect(isPublicRules([{}])).toBe(false);
      expect(isPublicRules(undefined)).toBe(false);
      expect(isPublicRules([])).toBe(false);
    });
  });
});
