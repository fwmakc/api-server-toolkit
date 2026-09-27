import { PermissionRegistry } from '../common/permission.registry';
import { EntityAccessConfig } from '../common/access.rules';

class EntityA {}
class EntityB {}

describe('PermissionRegistry', () => {
  beforeEach(() => {
    PermissionRegistry.clear();
  });

  afterEach(() => {
    PermissionRegistry.clear();
  });

  it('returns undefined for unregistered entity', () => {
    expect(PermissionRegistry.get(EntityA)).toBeUndefined();
  });

  it('has() returns false for unregistered entity', () => {
    expect(PermissionRegistry.has(EntityA)).toBe(false);
  });

  it('set() then get() returns config', () => {
    const config: EntityAccessConfig = {
      operations: {
        read: [{ who: ['public'] }],
        create: [{ who: ['superuser'] }],
      },
      fields: { title: { response: [{ who: ['moderator'] }] } },
    };
    PermissionRegistry.set(EntityA, config);
    expect(PermissionRegistry.get(EntityA)).toEqual(config);
    expect(PermissionRegistry.has(EntityA)).toBe(true);
  });

  it('delete() removes config', () => {
    PermissionRegistry.set(EntityA, { operations: { read: [{ who: ['public'] }] } });
    expect(PermissionRegistry.delete(EntityA)).toBe(true);
    expect(PermissionRegistry.has(EntityA)).toBe(false);
  });

  it('clear() empties registry', () => {
    PermissionRegistry.set(EntityA, {});
    PermissionRegistry.set(EntityB, {});
    PermissionRegistry.clear();
    expect(PermissionRegistry.has(EntityA)).toBe(false);
    expect(PermissionRegistry.has(EntityB)).toBe(false);
  });

  describe('getOwnerPath', () => {
    it('returns first owner scope from read rules', () => {
      PermissionRegistry.set(EntityA, {
        operations: {
          read: [
            { who: ['public'] },
            { who: ['authenticated'], scope: { owner: 'author.id' } },
          ],
          update: [{ who: ['authenticated'], scope: { owner: 'other.id' } }],
        },
      });
      expect(PermissionRegistry.getOwnerPath(EntityA)).toBe('author.id');
    });

    it('returns undefined when read has no owner scope', () => {
      PermissionRegistry.set(EntityA, {
        operations: {
          read: [{ who: ['authenticated'], scope: { tenant: 'tenant.id' } }],
          update: [{ who: ['authenticated'], scope: { owner: 'author.id' } }],
        },
      });
      expect(PermissionRegistry.getOwnerPath(EntityA)).toBeUndefined();
    });

    it('returns undefined for unregistered entity', () => {
      expect(PermissionRegistry.getOwnerPath(EntityB)).toBeUndefined();
    });
  });

  it('entries() exposes registered configs', () => {
    PermissionRegistry.set(EntityA, {});
    const entries = Array.from(PermissionRegistry.entries());
    expect(entries).toHaveLength(1);
    expect(entries[0][0]).toBe(EntityA);
  });
});
