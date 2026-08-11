import 'reflect-metadata';
import { resolveBindRelationId, resolveAutoAssign } from '../common/service/bind-resolve.helper';
import { BindDto } from '../common/dto/bind.dto';
import { EntityMetadata, EntityManager } from 'typeorm';

const createBind = (props: Partial<BindDto>): BindDto => Object.assign(new BindDto(), props);

const createMockMetadata = (relations: any[] = []) =>
  ({
    relations,
    primaryColumns: [{ propertyName: 'id' }],
    columns: [],
  } as unknown as EntityMetadata);

const createMockManager = (findOneResult?: any) => {
  const repo = {
    findOne: jest.fn().mockResolvedValue(findOneResult ?? null),
    metadata: {},
  };
  return {
    getRepository: jest.fn().mockReturnValue(repo),
  } as unknown as EntityManager;
};

describe('bind-resolve.helper', () => {
  describe('resolveBindRelationId', () => {
    it('returns bind.id directly when key is id', async () => {
      const manager = createMockManager();
      const bind = createBind({ id: 42, name: 'user' });
      const metadata = createMockMetadata();
      const result = await resolveBindRelationId(metadata, bind, manager);
      expect(result).toBe(42);
      expect((manager as any).getRepository).not.toHaveBeenCalled();
    });

    it('returns bind.id when key defaults to id', async () => {
      const manager = createMockManager();
      const bind = createBind({ id: 10, name: 'user' });
      const metadata = createMockMetadata();
      const result = await resolveBindRelationId(metadata, bind, manager);
      expect(result).toBe(10);
    });

    it('resolves by custom key through single relation', async () => {
      const relatedEntity = { id: 99, uuid: 'abc-123' };
      const manager = createMockManager(relatedEntity);
      const bind = createBind({ id: 'abc-123', name: 'user', key: 'uuid' });
      const metadata = createMockMetadata([
        { propertyName: 'user', inverseEntityMetadata: { target: 'UserEntity' } },
      ]);
      const result = await resolveBindRelationId(metadata, bind, manager);
      expect(result).toBe(99);
      expect((manager as any).getRepository).toHaveBeenCalled();
    });

    it('resolves through nested relation path', async () => {
      const deepEntity = { id: 55, code: 'X1' };
      const manager = createMockManager(deepEntity);
      const bind = createBind({ id: 'X1', name: 'user.team', key: 'code' });
      const metadata = createMockMetadata([
        {
          propertyName: 'user',
          inverseEntityMetadata: {
            target: 'UserEntity',
            relations: [
              { propertyName: 'team', inverseEntityMetadata: { target: 'TeamEntity' } },
            ],
          },
        },
      ]);
      const result = await resolveBindRelationId(metadata, bind, manager);
      expect(result).toBe(55);
    });

    it('returns null when relation not found', async () => {
      const manager = createMockManager();
      const bind = createBind({ id: 1, name: 'nonexistent', key: 'uuid' });
      const metadata = createMockMetadata([]);
      const result = await resolveBindRelationId(metadata, bind, manager);
      expect(result).toBeNull();
    });

    it('returns null when related entity not found', async () => {
      const manager = createMockManager(null);
      const bind = createBind({ id: 'missing', name: 'user', key: 'uuid' });
      const metadata = createMockMetadata([
        { propertyName: 'user', inverseEntityMetadata: { target: 'UserEntity' } },
      ]);
      const result = await resolveBindRelationId(metadata, bind, manager);
      expect(result).toBeNull();
    });
  });

  describe('resolveAutoAssign', () => {
    it('returns null when bind.id is undefined', async () => {
      const manager = createMockManager();
      const bind = createBind({ name: 'user' });
      const metadata = createMockMetadata();
      const result = await resolveAutoAssign(metadata, bind, manager);
      expect(result).toBeNull();
    });

    it('returns { name, id } for single segment relation', async () => {
      const relatedEntity = { id: 7, uuid: 'u1' };
      const manager = createMockManager(relatedEntity);
      const bind = createBind({ id: 'u1', name: 'user', key: 'uuid' });
      const metadata = createMockMetadata([
        { propertyName: 'user', inverseEntityMetadata: { target: 'UserEntity' } },
      ]);
      const result = await resolveAutoAssign(metadata, bind, manager);
      expect(result).toEqual({ name: 'user', id: 7 });
    });

    it('returns null for single segment when resolveBindRelationId returns null', async () => {
      const manager = createMockManager(null);
      const bind = createBind({ id: 'missing', name: 'user', key: 'uuid' });
      const metadata = createMockMetadata([
        { propertyName: 'user', inverseEntityMetadata: { target: 'UserEntity' } },
      ]);
      const result = await resolveAutoAssign(metadata, bind, manager);
      expect(result).toBeNull();
    });

    it('resolves nested path for many-to-one relation', async () => {
      const parentEntity = { id: 33 };
      const manager = createMockManager(parentEntity);
      const bind = createBind({ id: 1, name: 'user.team', key: 'id' });
      const metadata = createMockMetadata([
        {
          propertyName: 'user',
          relationType: 'many-to-one',
          inverseEntityMetadata: { target: 'UserEntity' },
        },
      ]);
      const result = await resolveAutoAssign(metadata, bind, manager);
      expect(result).toEqual({ name: 'user', id: 33 });
    });

    it('resolves nested path for one-to-one relation', async () => {
      const parentEntity = { id: 44 };
      const manager = createMockManager(parentEntity);
      const bind = createBind({ id: 1, name: 'profile.detail', key: 'id' });
      const metadata = createMockMetadata([
        {
          propertyName: 'profile',
          relationType: 'one-to-one',
          inverseEntityMetadata: { target: 'ProfileEntity' },
        },
      ]);
      const result = await resolveAutoAssign(metadata, bind, manager);
      expect(result).toEqual({ name: 'profile', id: 44 });
    });

    it('returns null for non many-to-one/one-to-one relations', async () => {
      const manager = createMockManager();
      const bind = createBind({ id: 1, name: 'users.items', key: 'id' });
      const metadata = createMockMetadata([
        {
          propertyName: 'users',
          relationType: 'one-to-many',
          inverseEntityMetadata: { target: 'UserEntity' },
        },
      ]);
      const result = await resolveAutoAssign(metadata, bind, manager);
      expect(result).toBeNull();
    });

    it('returns null when first segment relation not found', async () => {
      const manager = createMockManager();
      const bind = createBind({ id: 1, name: 'missing.nested', key: 'id' });
      const metadata = createMockMetadata([]);
      const result = await resolveAutoAssign(metadata, bind, manager);
      expect(result).toBeNull();
    });

    it('throws NotFoundException when nested path entity not found', async () => {
      const manager = createMockManager(null);
      const bind = createBind({ id: 999, name: 'user.team', key: 'id' });
      const metadata = createMockMetadata([
        {
          propertyName: 'user',
          relationType: 'many-to-one',
          inverseEntityMetadata: { target: 'UserEntity' },
        },
      ]);
      await expect(resolveAutoAssign(metadata, bind, manager)).rejects.toThrow('Entity not found for auto-assign path: user');
    });
  });
});
