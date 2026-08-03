import { PermissionRegistry } from '../common/permission.registry';

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
      create: 'superuser' as const,
      read: 'public' as const,
      update: 'owner' as const,
      delete: 'closed' as const,
      accountTable: 'accounts',
      accountField: 'accountId',
    };
    PermissionRegistry.set(EntityA, config);
    expect(PermissionRegistry.get(EntityA)).toEqual(config);
    expect(PermissionRegistry.has(EntityA)).toBe(true);
  });

  it('getCreate defaults to closed', () => {
    expect(PermissionRegistry.getCreate(EntityA)).toBe('closed');
  });

  it('getRead defaults to closed', () => {
    expect(PermissionRegistry.getRead(EntityA)).toBe('closed');
  });

  it('getUpdate defaults to closed', () => {
    expect(PermissionRegistry.getUpdate(EntityA)).toBe('closed');
  });

  it('getDelete defaults to closed', () => {
    expect(PermissionRegistry.getDelete(EntityA)).toBe('closed');
  });

  it('getCreate returns registered value', () => {
    PermissionRegistry.set(EntityA, {
      create: 'superuser',
      read: 'public',
      update: 'owner',
      delete: 'closed',
    });
    expect(PermissionRegistry.getCreate(EntityA)).toBe('superuser');
    expect(PermissionRegistry.getRead(EntityA)).toBe('public');
    expect(PermissionRegistry.getUpdate(EntityA)).toBe('owner');
    expect(PermissionRegistry.getDelete(EntityA)).toBe('closed');
  });

  it('getAccountTable returns registered value', () => {
    PermissionRegistry.set(EntityA, {
      create: 'public',
      read: 'public',
      update: 'public',
      delete: 'public',
      accountTable: 'users',
    });
    expect(PermissionRegistry.getAccountTable(EntityA)).toBe('users');
  });

  it('getAccountField returns registered value', () => {
    PermissionRegistry.set(EntityA, {
      create: 'public',
      read: 'public',
      update: 'public',
      delete: 'public',
      accountField: 'ownerId',
    });
    expect(PermissionRegistry.getAccountField(EntityA)).toBe('ownerId');
  });

  it('getAccountTable returns undefined for unregistered', () => {
    expect(PermissionRegistry.getAccountTable(EntityA)).toBeUndefined();
  });

  it('delete() removes entity and returns true', () => {
    PermissionRegistry.set(EntityA, {
      create: 'public',
      read: 'public',
      update: 'public',
      delete: 'public',
    });
    expect(PermissionRegistry.delete(EntityA)).toBe(true);
    expect(PermissionRegistry.has(EntityA)).toBe(false);
  });

  it('delete() returns false for unregistered entity', () => {
    expect(PermissionRegistry.delete(EntityB)).toBe(false);
  });

  it('clear() removes all entities', () => {
    PermissionRegistry.set(EntityA, {
      create: 'public',
      read: 'public',
      update: 'public',
      delete: 'public',
    });
    PermissionRegistry.set(EntityB, {
      create: 'public',
      read: 'public',
      update: 'public',
      delete: 'public',
    });
    PermissionRegistry.clear();
    expect(PermissionRegistry.has(EntityA)).toBe(false);
    expect(PermissionRegistry.has(EntityB)).toBe(false);
  });

  it('isolates configs between different entities', () => {
    PermissionRegistry.set(EntityA, {
      create: 'superuser',
      read: 'superuser',
      update: 'superuser',
      delete: 'superuser',
    });
    PermissionRegistry.set(EntityB, {
      create: 'public',
      read: 'public',
      update: 'public',
      delete: 'public',
    });
    expect(PermissionRegistry.getCreate(EntityA)).toBe('superuser');
    expect(PermissionRegistry.getCreate(EntityB)).toBe('public');
  });
});
