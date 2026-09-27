import 'reflect-metadata';
import { sanitizeForSave } from '../common/service/sanitize.service';
import { BindDto } from '../common/dto/bind.dto';
import { PermissionRegistry } from '../common/permission.registry';
import { EntityAccessConfig } from '../common/access.rules';
import { EntityMetadata, EntityManager } from 'typeorm';

class TagEntity {
  id?: number;
  author?: any;
}

// read-правило с owner-скопом — путь владельца для проверки прицепляемых id
const tagConfig: EntityAccessConfig = {
  operations: {
    read: [{ who: ['authenticated'], scope: { owner: 'author.id' } }],
    create: [{ who: ['public'] }],
  },
};

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

describe('sanitize.service (AccessRule model)', () => {
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
      PermissionRegistry.set(TagEntity, tagConfig);

      const entity: any = { title: 'test', tag: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'tag', target: TagEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tag).toBeUndefined();
    });

    it('keeps relation with id when owned', async () => {
      PermissionRegistry.set(TagEntity, tagConfig);

      const entity: any = { title: 'test', tag: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'tag', target: TagEntity }]);
      const manager = createMockManager([99]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tag).toEqual({ id: 99 });
    });

    it('keeps all relations when bind.allow is true', async () => {
      PermissionRegistry.set(TagEntity, tagConfig);

      const entity: any = { title: 'test', tag: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'tag', target: TagEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1, allow: true }), manager);

      expect(entity.tag).toEqual({ id: 99 });
    });

    it('keeps auto-assign relation without ownership check', async () => {
      PermissionRegistry.set(TagEntity, tagConfig);

      const entity: any = { title: 'test', tag: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'tag', target: TagEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1, name: 'tag' }), manager);

      expect(entity.tag).toEqual({ id: 99 });
    });

    it('strips relation when related entity has no access config (secure by default)', async () => {
      const entity: any = { title: 'test', tag: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'tag', target: TagEntity }]);
      const manager = createMockManager([99]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tag).toBeUndefined();
    });

    it('keeps relation when related config exists but has no owner scope', async () => {
      PermissionRegistry.set(TagEntity, {
        operations: { read: [{ who: ['authenticated'], scope: { tenant: 'tenant.id' } }] },
      });

      const entity: any = { title: 'test', tag: { id: 99 } };
      const metadata = createMockMetadata([{ name: 'tag', target: TagEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tag).toEqual({ id: 99 });
    });

    it('filters array relations by ownership', async () => {
      PermissionRegistry.set(TagEntity, tagConfig);

      const entity: any = {
        title: 'test',
        tags: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };
      const metadata = createMockMetadata([{ name: 'tags', target: TagEntity }]);
      const manager = createMockManager([1, 3]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tags).toEqual([{ id: 1 }, { id: 3 }]);
    });

    it('allows nested create when create rules match roles', async () => {
      PermissionRegistry.set(TagEntity, tagConfig);

      const entity: any = {
        title: 'test',
        tag: { title: 'new tag' },
      };
      const metadata = createMockMetadata([{ name: 'tag', target: TagEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tag).toEqual({ title: 'new tag' });
    });

    it('strips nested create when create rules do not match roles', async () => {
      PermissionRegistry.set(TagEntity, {
        operations: { create: [{ who: ['moderator'] }] },
      });

      const entity: any = {
        title: 'test',
        tag: { title: 'new tag' },
      };
      const metadata = createMockMetadata([{ name: 'tag', target: TagEntity }]);
      const manager = createMockManager([]);

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tag).toBeUndefined();
    });

    it('handles null/undefined relation values', async () => {
      const entity: any = { title: 'test', tag: null, tags: undefined };
      const metadata = createMockMetadata([
        { name: 'tag', target: TagEntity },
        { name: 'tags', target: TagEntity },
      ]);
      const manager = createMockManager();

      await sanitizeForSave(entity, metadata, createBind({ id: 1 }), manager);

      expect(entity.tag).toBeNull();
      expect(entity.tags).toBeUndefined();
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
