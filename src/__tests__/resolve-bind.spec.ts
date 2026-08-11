import { AccessLevel, TenantScope, AccountInfo } from '../common/access.type';
import {
  matchedRoleNames,
  resolveTenantScopeFromAccount,
  resolveBind,
} from '../common/entity.controller';

const originalTenantTable = process.env.TENANT_TABLE;

beforeAll(() => {
  process.env.TENANT_TABLE = 'tenant';
});

afterAll(() => {
  if (originalTenantTable !== undefined) {
    process.env.TENANT_TABLE = originalTenantTable;
  } else {
    delete process.env.TENANT_TABLE;
  }
});

const makeAccount = (overrides: Partial<AccountInfo> = {}): AccountInfo => ({
  id: 1,
  username: 'test@test.com',
  roles: [],
  ...overrides,
});

describe('matchedRoleNames', () => {
  it('returns intersection of account.roles and requiredRoles', () => {
    expect(matchedRoleNames(makeAccount({ roles: ['admin', 'editor'] }), ['admin'])).toEqual(['admin']);
  });

  it('returns all matched when multiple roles intersect', () => {
    expect(
      matchedRoleNames(makeAccount({ roles: ['admin', 'editor'] }), ['admin', 'editor']),
    ).toEqual(['admin', 'editor']);
  });

  it('returns empty array when no roles match', () => {
    expect(matchedRoleNames(makeAccount({ roles: ['editor'] }), ['admin'])).toEqual([]);
  });

  it('returns empty array when account.roles is undefined', () => {
    expect(matchedRoleNames(makeAccount({ roles: undefined }), ['admin'])).toEqual([]);
  });

  it('returns empty array when requiredRoles is empty', () => {
    expect(matchedRoleNames(makeAccount({ roles: ['admin'] }), [])).toEqual([]);
  });

  it('returns empty array when requiredRoles is undefined', () => {
    expect(matchedRoleNames(makeAccount({ roles: ['admin'] }), undefined as any)).toEqual([]);
  });

  it('returns empty when both are empty', () => {
    expect(matchedRoleNames(makeAccount({ roles: [] }), [])).toEqual([]);
  });

  it('preserves order of requiredRoles', () => {
    expect(
      matchedRoleNames(makeAccount({ roles: ['editor', 'admin'] }), ['admin', 'editor']),
    ).toEqual(['admin', 'editor']);
  });
});

describe('resolveTenantScopeFromAccount', () => {
  it('returns ALL when matched role has tenant=all', () => {
    const account = makeAccount({
      roleEntries: [{ role: 'admin', tenant: 'all' }],
    });
    expect(resolveTenantScopeFromAccount(account, ['admin'])).toBe(TenantScope.ALL);
  });

  it('returns undefined when matched role has tenant=own', () => {
    const account = makeAccount({
      roleEntries: [{ role: 'admin', tenant: 'own' }],
    });
    expect(resolveTenantScopeFromAccount(account, ['admin'])).toBeUndefined();
  });

  it('returns undefined when matched role has no tenant property', () => {
    const account = makeAccount({
      roleEntries: [{ role: 'admin' }],
    });
    expect(resolveTenantScopeFromAccount(account, ['admin'])).toBeUndefined();
  });

  it('returns undefined when matched role is not in roleEntries', () => {
    const account = makeAccount({
      roleEntries: [{ role: 'admin', tenant: 'all' }],
    });
    expect(resolveTenantScopeFromAccount(account, ['editor'])).toBeUndefined();
  });

  it('returns undefined when roleEntries is empty', () => {
    const account = makeAccount({ roleEntries: [] });
    expect(resolveTenantScopeFromAccount(account, ['admin'])).toBeUndefined();
  });

  it('returns undefined when roleEntries is undefined', () => {
    const account = makeAccount({ roleEntries: undefined });
    expect(resolveTenantScopeFromAccount(account, ['admin'])).toBeUndefined();
  });

  it('returns undefined when matchedRoles is empty', () => {
    const account = makeAccount({
      roleEntries: [{ role: 'admin', tenant: 'all' }],
    });
    expect(resolveTenantScopeFromAccount(account, [])).toBeUndefined();
  });

  it('returns undefined when matchedRoles is undefined', () => {
    const account = makeAccount({
      roleEntries: [{ role: 'admin', tenant: 'all' }],
    });
    expect(resolveTenantScopeFromAccount(account, undefined)).toBeUndefined();
  });

  it('returns ALL when any matched role has tenant=all among multiple entries', () => {
    const account = makeAccount({
      roleEntries: [
        { role: 'viewer', tenant: 'own' },
        { role: 'admin', tenant: 'all' },
      ],
    });
    expect(resolveTenantScopeFromAccount(account, ['viewer', 'admin'])).toBe(TenantScope.ALL);
  });

  it('returns undefined when no matched entry has tenant=all', () => {
    const account = makeAccount({
      roleEntries: [
        { role: 'viewer', tenant: 'own' },
        { role: 'admin', tenant: 'own' },
      ],
    });
    expect(resolveTenantScopeFromAccount(account, ['viewer', 'admin'])).toBeUndefined();
  });

  it('strict string check: tenant=ALL (uppercase) is not all', () => {
    const account = makeAccount({
      roleEntries: [{ role: 'admin', tenant: 'ALL' }],
    });
    expect(resolveTenantScopeFromAccount(account, ['admin'])).toBeUndefined();
  });
});

describe('resolveBind', () => {
  const defaultTable = '';
  const defaultField = '';

  describe('CLOSED + roles', () => {
    it('returns bind with tenantId when hasRoles and tenantId present', () => {
      const account = makeAccount({ tenantId: 5 });
      const result = resolveBind(AccessLevel.CLOSED, account, defaultTable, defaultField, 'tenant', 'id', true, []);
      expect(result).toBeDefined();
      expect(result!.tenantId).toBe(5);
      expect(result!.allow).toBe(false);
    });

    it('returns bind without tenantId when tenantScope=ALL', () => {
      const account = makeAccount({
        tenantId: 5,
        roleEntries: [{ role: 'admin', tenant: 'all' }],
        roles: ['admin'],
      });
      const result = resolveBind(AccessLevel.CLOSED, account, defaultTable, defaultField, 'tenant', 'id', true, ['admin']);
      expect(result).toBeDefined();
      expect(result!.tenantId).toBeUndefined();
      expect(result!.tenantScope).toBe(TenantScope.ALL);
    });

    it('returns undefined when hasRoles is false', () => {
      const account = makeAccount({ tenantId: 5 });
      const result = resolveBind(AccessLevel.CLOSED, account, defaultTable, defaultField, 'tenant', 'id', false, []);
      expect(result).toBeUndefined();
    });

    it('returns undefined when account has no tenantId', () => {
      const account = makeAccount({ tenantId: undefined });
      const result = resolveBind(AccessLevel.CLOSED, account, defaultTable, defaultField, 'tenant', 'id', true, []);
      expect(result).toBeUndefined();
    });

    it('sets roles from account', () => {
      const account = makeAccount({ tenantId: 5, roles: ['admin', 'editor'] });
      const result = resolveBind(AccessLevel.CLOSED, account, defaultTable, defaultField, 'tenant', 'id', true, []);
      expect(result!.roles).toEqual(['admin', 'editor']);
    });
  });

  describe('TENANT + tenantScope', () => {
    it('removes tenantId when tenantScope=ALL', () => {
      const account = makeAccount({
        tenantId: 5,
        roleEntries: [{ role: 'admin', tenant: 'all' }],
        roles: ['admin'],
      });
      const result = resolveBind(AccessLevel.TENANT, account, defaultTable, defaultField, 'tenant', 'id', false, ['admin']);
      expect(result).toBeDefined();
      expect(result!.tenantId).toBeUndefined();
      expect(result!.tenantScope).toBe(TenantScope.ALL);
    });

    it('keeps tenantId when no tenantScope', () => {
      const account = makeAccount({ tenantId: 5, roles: ['admin'] });
      const result = resolveBind(AccessLevel.TENANT, account, defaultTable, defaultField, 'tenant', 'id', false, []);
      expect(result).toBeDefined();
      expect(result!.tenantId).toBe(5);
      expect(result!.tenantScope).toBeUndefined();
    });
  });

  describe('OWNER + tenantScope', () => {
    it('keeps id but removes tenantId when tenantScope=ALL', () => {
      const account = makeAccount({
        id: 42,
        tenantId: 5,
        roleEntries: [{ role: 'admin', tenant: 'all' }],
        roles: ['admin'],
      });
      const result = resolveBind(AccessLevel.OWNER, account, 'account', 'id', 'tenant', 'id', false, ['admin']);
      expect(result).toBeDefined();
      expect(result!.id).toBe(42);
      expect(result!.tenantId).toBeUndefined();
      expect(result!.tenantScope).toBe(TenantScope.ALL);
    });

    it('keeps both id and tenantId when no tenantScope', () => {
      const account = makeAccount({ id: 42, tenantId: 5, roles: ['admin'] });
      const result = resolveBind(AccessLevel.OWNER, account, 'account', 'id', 'tenant', 'id', false, []);
      expect(result).toBeDefined();
      expect(result!.id).toBe(42);
      expect(result!.tenantId).toBe(5);
    });
  });

  describe('PUBLIC', () => {
    it('returns undefined for PUBLIC access', () => {
      const account = makeAccount({ tenantId: 5, roles: ['admin'] });
      const result = resolveBind(AccessLevel.PUBLIC, account, defaultTable, defaultField);
      expect(result).toBeUndefined();
    });
  });

  describe('SUPERUSER', () => {
    it('returns allow=true with roles', () => {
      const account = makeAccount({ roles: ['admin'] });
      const result = resolveBind(AccessLevel.SUPERUSER, account, defaultTable, defaultField);
      expect(result).toEqual({ allow: true, roles: ['admin'] });
    });

    it('returns allow=true even with no roles', () => {
      const account = makeAccount({ roles: [] });
      const result = resolveBind(AccessLevel.SUPERUSER, account, defaultTable, defaultField);
      expect(result).toEqual({ allow: true, roles: [] });
    });
  });

  describe('superuser account (isSuperuser=true)', () => {
    it('CLOSED + roles + superuser → allow=true', () => {
      const account = makeAccount({ tenantId: 5, isSuperuser: true, roles: ['admin'] });
      const result = resolveBind(AccessLevel.CLOSED, account, defaultTable, defaultField, 'tenant', 'id', true, []);
      expect(result).toBeDefined();
      expect(result!.allow).toBe(true);
    });

    it('TENANT + superuser → undefined (no restrictions for superuser)', () => {
      const account = makeAccount({ tenantId: 5, isSuperuser: true });
      const result = resolveBind(AccessLevel.TENANT, account, defaultTable, defaultField, 'tenant', 'id', false, []);
      expect(result).toBeUndefined();
    });
  });
});
