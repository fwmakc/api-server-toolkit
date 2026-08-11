import 'reflect-metadata';
import { sanitizeForSave } from '../common/service/sanitize.service';
import { BindDto } from '../common/dto/bind.dto';
import { PermissionRegistry } from '../common/permission.registry';
import { AccessLevel } from '../common/access.type';
import { EntityMetadata, EntityManager } from 'typeorm';

class UserEntity {
  id?: number;
  account?: any;
}

const createBind = (props: Partial<BindDto>): BindDto => Object.assign(new BindDto(), props);

function createMockMetadata(relations: any[] = []): EntityMetadata {
  class DynamicTarget {}
  return {
    target: DynamicTarget,
    relations: relations.map((r) => ({
      propertyName: r.name,
      inverseEntityMetadata: {
        target: r.target,
        relations: [],
        columns: [],
      },
    })),
    columns: [],
  } as unknown as EntityMetadata;
}

function createMockManager(ownedIds: any[] = []): EntityManager {
  const qb = {
    leftJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(ownedIds.map((id) => ({ id }))),
  };
  const repo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
  return { getRepository: jest.fn().mockReturnValue(repo) } as unknown as EntityManager;
}

describe('sanitize.service', () => {
  beforeEach(() => {
    PermissionRegistry.clear();
  });

  describe('sanitizeForSave', () => {
    it('does nothing for entity without relations', async () => {
      const entity = { title: 'test' };
      const metadata = createMockMetadata([]);
      const manager = createMockManager();
      await sanitizeForSave(entity, metadata, undefined, manager);
      expect(entity).toEqual({ title: 'test' });
    });

    it('strips relation with id when not owned', async () => {
      PermissionRegistry.set(UserEntity, {
        accountTable: 'account',
        accountField: 'id',
        create: AccessLevel.PUBLIC,
      } as any);

      const entity: any = { title: 'test', user: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'user', target: UserEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.user).toBeUndefined();
    });

    it('keeps relation with id when owned', async () => {
      PermissionRegistry.set(UserEntity, {
        accountTable: 'account',
        accountField: 'id',
        create: AccessLevel.PUBLIC,
      } as any);

      const entity: any = { title: 'test', user: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'user', target: UserEntity }]);
      const manager = createMockManager([99]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.user).toEqual({ id: 99 });
    });

    it('keeps all relations when bind.allow is true', async () => {
      PermissionRegistry.set(UserEntity, {
        accountTable: 'account',
        accountField: 'id',
        create: AccessLevel.PUBLIC,
      } as any);

      const entity: any = { title: 'test', user: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'user', target: UserEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1, allow: true }), manager);

      expect(entity.user).toEqual({ id: 99 });
    });

    it('keeps auto-assign relation without ownership check', async () => {
      PermissionRegistry.set(UserEntity, {
        accountTable: 'account',
        accountField: 'id',
        create: AccessLevel.PUBLIC,
      } as any);

      const entity: any = { title: 'test', user: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'user', target: UserEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1, name: 'user' }), manager);

      expect(entity.user).toEqual({ id: 99 });
    });

    it('filters array relations by ownership', async () => {
      PermissionRegistry.set(UserEntity, {
        accountTable: 'account',
        accountField: 'id',
        create: AccessLevel.PUBLIC,
      } as any);

      const entity: any = {
        title: 'test',
        tags: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ],
      };
      const metadata = createMockMetadata([{ name: 'tags', target: UserEntity }]);
      const manager = createMockManager([1, 3]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tags).toEqual([{ id: 1 }, { id: 3 }]);
    });

    it('handles null/undefined relation values', async () => {
      const entity: any = { title: 'test', user: null, tags: undefined };
      const metadata = createMockMetadata([
        { name: 'user', target: UserEntity },
        { name: 'tags', target: UserEntity },
      ]);
      const manager = createMockManager();

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.user).toBeNull();
      expect(entity.tags).toBeUndefined();
    });

    it('strips relation when no config for target and no allow', async () => {
      const entity: any = { title: 'test', user: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'user', target: UserEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.user).toBeUndefined();
    });

    it('does nothing for undefined entity', async () => {
      const metadata = createMockMetadata([]);
      const manager = createMockManager();
      await sanitizeForSave(undefined, metadata, undefined, manager);
    });

    it('does nothing for non-object entity', async () => {
      const metadata = createMockMetadata([]);
      const manager = createMockManager();
      await sanitizeForSave('string' as any, metadata, undefined, manager);
    });
  });
});
