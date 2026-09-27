import 'reflect-metadata';

describe('tenant bind', () => {
  describe('bind() populates tenant scope', () => {
    let originalTenantTable: string | undefined;

    beforeEach(() => {
      jest.resetModules();
      originalTenantTable = process.env.TENANT_TABLE;
    });

    afterEach(() => {
      process.env.TENANT_TABLE = originalTenantTable;
      jest.resetModules();
    });

    it('does NOT populate tenant when TENANT_TABLE is not set', async () => {
      delete process.env.TENANT_TABLE;
      const { bind } = await import('../common/service/bind.service');
      const result = bind(
        { id: 1, tenantId: 5 },
        { allow: false, name: 'account' },
      );
      expect(result.tenantName).toBeUndefined();
      expect(result.tenantId).toBeUndefined();
    });

    it('populates tenant scope from env var + account.tenantId', async () => {
      process.env.TENANT_TABLE = 'tenant';
      const { bind } = await import('../common/service/bind.service');
      const result = bind(
        { id: 1, tenantId: 5 },
        { allow: false, name: 'account' },
      );
      expect(result.tenantName).toBe('tenant');
      expect(result.tenantId).toBe(5);
      expect(result.tenantKey).toBe('id');
    });

    it('uses custom TENANT_FIELD', async () => {
      process.env.TENANT_TABLE = 'organization';
      process.env.TENANT_FIELD = 'uuid';
      const { bind } = await import('../common/service/bind.service');
      const result = bind(
        { id: 1, tenantId: 'org-abc' },
        { allow: false, name: 'account' },
      );
      expect(result.tenantName).toBe('organization');
      expect(result.tenantKey).toBe('uuid');
      process.env.TENANT_FIELD = 'id';
    });

    it('explicit tenantName overrides env var', async () => {
      process.env.TENANT_TABLE = 'tenant';
      const { bind } = await import('../common/service/bind.service');
      const result = bind(
        { id: 1, tenantId: 5 },
        { allow: false, name: 'account', tenantName: 'organization' },
      );
      expect(result.tenantName).toBe('organization');
    });

    it('superuser bind has no tenant scope (allow=true)', async () => {
      process.env.TENANT_TABLE = 'tenant';
      const { bind } = await import('../common/service/bind.service');
      const result = bind(
        { id: 1, tenantId: 5, isSuperuser: true },
        { allow: true, name: 'account' },
      );
      expect(result.tenantName).toBe('tenant');
      expect(result.tenantId).toBe(5);
      expect(result.allow).toBe(true);
    });
  });
});
