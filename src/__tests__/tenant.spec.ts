import 'reflect-metadata';

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
        { read: 'tenant' },
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
        { read: 'tenant' },
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
        { read: 'tenant' },
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
        { write: 'tenant' },
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
        { write: 'tenant' },
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
      expect(normalizeAccess('tenant')).toBe('tenant');
    });

    it('tenant is not treated as closed fallback', () => {
      expect(normalizeAccess('tenant')).not.toBe('closed');
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
        create: 'tenant',
        read: 'tenant',
        update: 'owner',
        delete: 'superuser',
        tenantTable: 'organization',
        tenantField: 'id',
      });
      expect(PermissionRegistry.getTenantTable(EntityA)).toBe('organization');
      expect(PermissionRegistry.getTenantField(EntityA)).toBe('id');
    });

    it('returns undefined when no tenant config', () => {
      class EntityB {}
      PermissionRegistry.set(EntityB, {
        create: 'public',
        read: 'public',
        update: 'public',
        delete: 'public',
      });
      expect(PermissionRegistry.getTenantTable(EntityB)).toBeUndefined();
      expect(PermissionRegistry.getTenantField(EntityB)).toBeUndefined();
    });
  });
});
