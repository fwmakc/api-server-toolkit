import { PermissionRegistry } from '../common/permission.registry';
import { AccessLevel } from '../common/access.type';

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
    const config = {
      create: AccessLevel.SUPERUSER as const,
      read: AccessLevel.PUBLIC as const,
      update: AccessLevel.OWNER as const,
      delete: AccessLevel.CLOSED as const,
      accountTable: 'accounts',
      accountField: 'accountId',
    };
    PermissionRegistry.set(EntityA, config);
    expect(PermissionRegistry.get(EntityA)).toEqual(config);
    expect(PermissionRegistry.has(EntityA)).toBe(true);
  });

  it('getCreate defaults to closed', () => {
    expect(PermissionRegistry.getCreate(EntityA)).toBe(AccessLevel.CLOSED);
  });

  it('getRead defaults to closed', () => {
    expect(PermissionRegistry.getRead(EntityA)).toBe(AccessLevel.CLOSED);
  });

  it('getUpdate defaults to closed', () => {
    expect(PermissionRegistry.getUpdate(EntityA)).toBe(AccessLevel.CLOSED);
  });

  it('getDelete defaults to closed', () => {
    expect(PermissionRegistry.getDelete(EntityA)).toBe(AccessLevel.CLOSED);
  });

  it('getCreate returns registered value', () => {
    PermissionRegistry.set(EntityA, {
      create: AccessLevel.SUPERUSER,
      read: AccessLevel.PUBLIC,
      update: AccessLevel.OWNER,
      delete: AccessLevel.CLOSED,
    });
    expect(PermissionRegistry.getCreate(EntityA)).toBe(AccessLevel.SUPERUSER);
    expect(PermissionRegistry.getRead(EntityA)).toBe(AccessLevel.PUBLIC);
    expect(PermissionRegistry.getUpdate(EntityA)).toBe(AccessLevel.OWNER);
    expect(PermissionRegistry.getDelete(EntityA)).toBe(AccessLevel.CLOSED);
  });

  it('getAccountTable returns registered value', () => {
    PermissionRegistry.set(EntityA, {
      create: AccessLevel.PUBLIC,
      read: AccessLevel.PUBLIC,
      update: AccessLevel.PUBLIC,
      delete: AccessLevel.PUBLIC,
      accountTable: 'users',
    });
    expect(PermissionRegistry.getAccountTable(EntityA)).toBe('users');
  });

  it('getAccountField returns registered value', () => {
    PermissionRegistry.set(EntityA, {
      create: AccessLevel.PUBLIC,
      read: AccessLevel.PUBLIC,
      update: AccessLevel.PUBLIC,
      delete: AccessLevel.PUBLIC,
      accountField: 'ownerId',
    });
    expect(PermissionRegistry.getAccountField(EntityA)).toBe('ownerId');
  });

  it('getAccountTable returns undefined for unregistered', () => {
    expect(PermissionRegistry.getAccountTable(EntityA)).toBeUndefined();
  });

  it('delete() removes entity and returns true', () => {
    PermissionRegistry.set(EntityA, {
      create: AccessLevel.PUBLIC,
      read: AccessLevel.PUBLIC,
      update: AccessLevel.PUBLIC,
      delete: AccessLevel.PUBLIC,
    });
    expect(PermissionRegistry.delete(EntityA)).toBe(true);
    expect(PermissionRegistry.has(EntityA)).toBe(false);
  });

  it('delete() returns false for unregistered entity', () => {
    expect(PermissionRegistry.delete(EntityB)).toBe(false);
  });

  it('clear() removes all entities', () => {
    PermissionRegistry.set(EntityA, {
      create: AccessLevel.PUBLIC,
      read: AccessLevel.PUBLIC,
      update: AccessLevel.PUBLIC,
      delete: AccessLevel.PUBLIC,
    });
    PermissionRegistry.set(EntityB, {
      create: AccessLevel.PUBLIC,
      read: AccessLevel.PUBLIC,
      update: AccessLevel.PUBLIC,
      delete: AccessLevel.PUBLIC,
    });
    PermissionRegistry.clear();
    expect(PermissionRegistry.has(EntityA)).toBe(false);
    expect(PermissionRegistry.has(EntityB)).toBe(false);
  });

  it('isolates configs between different entities', () => {
    PermissionRegistry.set(EntityA, {
      create: AccessLevel.SUPERUSER,
      read: AccessLevel.SUPERUSER,
      update: AccessLevel.SUPERUSER,
      delete: AccessLevel.SUPERUSER,
    });
    PermissionRegistry.set(EntityB, {
      create: AccessLevel.PUBLIC,
      read: AccessLevel.PUBLIC,
      update: AccessLevel.PUBLIC,
      delete: AccessLevel.PUBLIC,
    });
    expect(PermissionRegistry.getCreate(EntityA)).toBe(AccessLevel.SUPERUSER);
    expect(PermissionRegistry.getCreate(EntityB)).toBe(AccessLevel.PUBLIC);
  });
});
