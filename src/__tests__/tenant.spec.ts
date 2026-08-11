import 'reflect-metadata';
import { AccessLevel, TenantScope } from '../common/access.type';

describe('tenant bind and field access', () => {
  describe('bind() populates tenant scope', () => {
    let bindFn: any;
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

  describe('canRead with tenant level', () => {
    let canRead: any;

    beforeAll(() => {
      jest.resetModules();
      const mod = require('../common/service/private_fields.service');
      canRead = (mod as any).canRead || mod.canRead;
    });

    it('tenant level: visible when tenantId is present', () => {
      const { removePrivateFields } = require('../common/service/private_fields.service');

      class TestEntity {
        title: string;
        orgNote: string;
      }
      const proto = TestEntity.prototype;
      const { FieldAccess } = require('../common/decorator/field_access.decorator');

      Reflect.defineMetadata(
        'fieldAccess',
        { read: AccessLevel.TENANT },
        proto,
        'orgNote',
      );

      const entity: any = new TestEntity();
      entity.title = 'Hello';
      entity.orgNote = 'secret';

      const bind = { allow: false, tenantId: 5, tenantName: 'tenant' };
      removePrivateFields(entity, bind);
      expect(entity.orgNote).toBe('secret');
    });

    it('tenant level: hidden when no tenantId in bind', () => {
      const { removePrivateFields } = require('../common/service/private_fields.service');

      class TestEntity2 {
        title: string;
        orgNote: string;
      }
      const proto = TestEntity2.prototype;
      Reflect.defineMetadata(
        'fieldAccess',
        { read: AccessLevel.TENANT },
        proto,
        'orgNote',
      );

      const entity: any = new TestEntity2();
      entity.title = 'Hello';
      entity.orgNote = 'secret';

      const bind = { allow: false };
      removePrivateFields(entity, bind);
      expect(entity.orgNote).toBeUndefined();
    });

    it('tenant level: visible when allow=true (superuser)', () => {
      const { removePrivateFields } = require('../common/service/private_fields.service');

      class TestEntity3 {
        title: string;
        orgNote: string;
      }
      const proto = TestEntity3.prototype;
      Reflect.defineMetadata(
        'fieldAccess',
        { read: AccessLevel.TENANT },
        proto,
        'orgNote',
      );

      const entity: any = new TestEntity3();
      entity.title = 'Hello';
      entity.orgNote = 'secret';

      const bind = { allow: true };
      removePrivateFields(entity, bind);
      expect(entity.orgNote).toBe('secret');
    });
  });

  describe('canWrite with tenant level', () => {
    it('tenant write level: writable when tenantId present', () => {
      const { stripWriteFields } = require('../common/service/private_fields.service');

      class TestWrite {
        title: string;
        orgField: string;
      }
      const proto = TestWrite.prototype;
      Reflect.defineMetadata(
        'fieldAccess',
        { write: AccessLevel.TENANT },
        proto,
        'orgField',
      );

      const dto: any = { title: 'X', orgField: 'Y' };
      stripWriteFields(dto, TestWrite, { allow: false, tenantId: 5 });
      expect(dto.orgField).toBe('Y');
    });

    it('tenant write level: stripped when no tenantId', () => {
      const { stripWriteFields } = require('../common/service/private_fields.service');

      class TestWrite2 {
        title: string;
        orgField: string;
      }
      const proto = TestWrite2.prototype;
      Reflect.defineMetadata(
        'fieldAccess',
        { write: AccessLevel.TENANT },
        proto,
        'orgField',
      );

      const dto: any = { title: 'X', orgField: 'Y' };
      stripWriteFields(dto, TestWrite2, { allow: false });
      expect(dto.orgField).toBeUndefined();
    });
  });

  describe('normalizeAccess includes tenant', () => {
    const { normalizeAccess } = require('../common/access.type');

    it('normalizes tenant level', () => {
      expect(normalizeAccess(AccessLevel.TENANT)).toBe(AccessLevel.TENANT);
    });

    it('tenant is not treated as closed fallback', () => {
      expect(normalizeAccess(AccessLevel.TENANT)).not.toBe(AccessLevel.CLOSED);
    });
  });

  describe('PermissionRegistry tenant config', () => {
    const { PermissionRegistry } = require('../common/permission.registry');

    afterEach(() => {
      PermissionRegistry.clear();
    });

    it('stores and retrieves tenantTable', () => {
      class EntityA {}
      PermissionRegistry.set(EntityA, {
        create: AccessLevel.TENANT,
        read: AccessLevel.TENANT,
        update: AccessLevel.OWNER,
        delete: AccessLevel.SUPERUSER,
        tenantTable: 'organization',
        tenantField: 'id',
      });
      expect(PermissionRegistry.getTenantTable(EntityA)).toBe('organization');
      expect(PermissionRegistry.getTenantField(EntityA)).toBe('id');
    });

    it('returns undefined when no tenant config', () => {
      class EntityB {}
      PermissionRegistry.set(EntityB, {
        create: AccessLevel.PUBLIC,
        read: AccessLevel.PUBLIC,
        update: AccessLevel.PUBLIC,
        delete: AccessLevel.PUBLIC,
      });
      expect(PermissionRegistry.getTenantTable(EntityB)).toBeUndefined();
      expect(PermissionRegistry.getTenantField(EntityB)).toBeUndefined();
    });
  });

  describe('resolveTenantScope', () => {
    const { resolveTenantScope } = require('../common/access.type');

    it('returns undefined when no roleEntries', () => {
      expect(resolveTenantScope(undefined, ['admin'])).toBeUndefined();
      expect(resolveTenantScope([], ['admin'])).toBeUndefined();
    });

    it('returns undefined when no matchedRoles', () => {
      expect(resolveTenantScope([{ role: 'admin', tenant: 'all' }], [])).toBeUndefined();
      expect(resolveTenantScope([{ role: 'admin', tenant: 'all' }], undefined)).toBeUndefined();
    });

    it('returns undefined for string-only entries (no tenant scope)', () => {
      expect(resolveTenantScope(['admin'], ['admin'])).toBeUndefined();
    });

    it('returns undefined when matched role has no tenant property', () => {
      expect(resolveTenantScope([{ role: 'admin' }], ['admin'])).toBeUndefined();
    });

    it('returns ALL when matched role has tenant=ALL enum', () => {
      expect(resolveTenantScope([{ role: 'admin', tenant: TenantScope.ALL }], ['admin'])).toBe(TenantScope.ALL);
    });

    it('returns ALL when matched role has tenant="all" string', () => {
      expect(resolveTenantScope([{ role: 'admin', tenant: 'all' }], ['admin'])).toBe(TenantScope.ALL);
    });

    it('returns undefined when role has tenant="own"', () => {
      expect(resolveTenantScope([{ role: 'admin', tenant: 'own' }], ['admin'])).toBeUndefined();
    });

    it('returns ALL when any matched role has tenant=all (even if others have own)', () => {
      const entries = [
        { role: 'viewer', tenant: 'own' },
        { role: 'admin', tenant: 'all' },
      ];
      expect(resolveTenantScope(entries, ['viewer', 'admin'])).toBe(TenantScope.ALL);
    });

    it('ignores entries whose role is not in matchedRoles', () => {
      const entries = [
        { role: 'superadmin', tenant: 'all' },
        { role: 'admin', tenant: 'own' },
      ];
      expect(resolveTenantScope(entries, ['admin'])).toBeUndefined();
    });

    it('returns undefined when matched role entry exists but tenant is not all', () => {
      expect(resolveTenantScope([{ role: 'admin', tenant: 'own' }], ['admin'])).toBeUndefined();
    });
  });
});
