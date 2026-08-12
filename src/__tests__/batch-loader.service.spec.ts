import 'reflect-metadata';
import { batchLoadRelations } from '../common/service/batch-loader.service';

function createMockRelation(opts: {
  propertyName: string;
  relationType: 'one-to-many' | 'many-to-one' | 'one-to-one' | 'many-to-many';
  entityMetadata: any;
  inverseEntityMetadata: any;
  inverseRelation?: any;
  joinColumns?: any[];
  inverseJoinColumns?: any[];
  joinTableName?: string;
  isOwning?: boolean;
}): any {
  return { ...opts };
}

function createMockMetadata(opts: {
  target: any;
  tableName: string;
  relations: any[];
}): any {
  return { ...opts };
}

function createManager(overrides?: {
  query?: any;
  getRepository?: any;
}): any {
  const mockFind = jest.fn().mockResolvedValue([]);
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
  };
  const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
  const mockGetRepository = jest.fn().mockReturnValue({
    find: mockFind,
    createQueryBuilder: mockCreateQueryBuilder,
  });
  const mockQuery = jest.fn().mockResolvedValue([]);

  const manager: any = {
    query: overrides?.query ?? mockQuery,
    getRepository: overrides?.getRepository ?? mockGetRepository,
  };

  manager.mockFind = mockFind;
  manager.mockQueryBuilder = mockQueryBuilder;
  manager.mockCreateQueryBuilder = mockCreateQueryBuilder;
  manager.mockGetRepository = mockGetRepository;
  manager.mockQuery = mockQuery;

  return manager;
}

describe('batchLoadRelations', () => {
  describe('no-op cases', () => {
    it('returns immediately for empty entities array', async () => {
      const metadata = createMockMetadata({
        target: class Post {},
        tableName: 'posts',
        relations: [],
      });
      const manager = createManager();

      await batchLoadRelations([], ['user'], metadata as any, manager);

      expect(manager.mockQuery).not.toHaveBeenCalled();
      expect(manager.mockGetRepository).not.toHaveBeenCalled();
    });

    it('returns immediately for empty relationPaths', async () => {
      const metadata = createMockMetadata({
        target: class Post {},
        tableName: 'posts',
        relations: [],
      });
      const manager = createManager();
      const entities: any[] = [{ id: 1 }];

      await batchLoadRelations(entities, [], metadata as any, manager);

      expect(manager.mockQuery).not.toHaveBeenCalled();
      expect(manager.mockGetRepository).not.toHaveBeenCalled();
    });
  });

  describe('many-to-one', () => {
    it('loads related entities and assigns to property', async () => {
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const postMeta = createMockMetadata({
        target: class Post {},
        tableName: 'posts',
        relations: [],
      });
      const userRel = createMockRelation({
        propertyName: 'user',
        relationType: 'many-to-one',
        entityMetadata: postMeta,
        inverseEntityMetadata: userMeta,
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      });
      postMeta.relations = [userRel];

      const mockQuery = jest
        .fn()
        .mockResolvedValue([
          { id: 1, fk: 10 },
          { id: 2, fk: 20 },
        ]);
      const mockFind = jest.fn().mockResolvedValue([
        { id: 10, name: 'Alice' },
        { id: 20, name: 'Bob' },
      ]);
      const manager = createManager({ query: mockQuery, getRepository: jest.fn().mockReturnValue({ find: mockFind }) });

      const entities: any[] = [{ id: 1 }, { id: 2 }];

      await batchLoadRelations(entities, ['user'], postMeta as any, manager);

      expect(entities[0].user).toEqual({ id: 10, name: 'Alice' });
      expect(entities[1].user).toEqual({ id: 20, name: 'Bob' });
    });

    it('assigns null for null FK values', async () => {
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const postMeta = createMockMetadata({
        target: class Post {},
        tableName: 'posts',
        relations: [],
      });
      const userRel = createMockRelation({
        propertyName: 'user',
        relationType: 'many-to-one',
        entityMetadata: postMeta,
        inverseEntityMetadata: userMeta,
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      });
      postMeta.relations = [userRel];

      const mockQuery = jest.fn().mockResolvedValue([{ id: 1, fk: null }]);
      const manager = createManager({
        query: mockQuery,
        getRepository: jest.fn().mockReturnValue({ find: jest.fn().mockResolvedValue([]) }),
      });

      const entities: any[] = [{ id: 1 }];

      await batchLoadRelations(entities, ['user'], postMeta as any, manager);

      expect(entities[0].user).toBeNull();
    });

    it('deduplicates FK values and assigns same entity to multiple parents', async () => {
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const postMeta = createMockMetadata({
        target: class Post {},
        tableName: 'posts',
        relations: [],
      });
      const userRel = createMockRelation({
        propertyName: 'user',
        relationType: 'many-to-one',
        entityMetadata: postMeta,
        inverseEntityMetadata: userMeta,
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      });
      postMeta.relations = [userRel];

      const mockQuery = jest
        .fn()
        .mockResolvedValue([
          { id: 1, fk: 10 },
          { id: 2, fk: 10 },
        ]);
      const mockFind = jest.fn().mockResolvedValue([{ id: 10, name: 'Alice' }]);
      const manager = createManager({ query: mockQuery, getRepository: jest.fn().mockReturnValue({ find: mockFind }) });

      const entities: any[] = [{ id: 1 }, { id: 2 }];

      await batchLoadRelations(entities, ['user'], postMeta as any, manager);

      expect(entities[0].user).toEqual({ id: 10, name: 'Alice' });
      expect(entities[1].user).toEqual({ id: 10, name: 'Alice' });
      expect(mockFind).toHaveBeenCalledTimes(1);
    });
  });

  describe('one-to-one', () => {
    it('loads related entity and assigns to property', async () => {
      const profileMeta = createMockMetadata({
        target: class Profile {},
        tableName: 'profiles',
        relations: [],
      });
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const profileRel = createMockRelation({
        propertyName: 'profile',
        relationType: 'one-to-one',
        entityMetadata: userMeta,
        inverseEntityMetadata: profileMeta,
        joinColumns: [
          {
            databaseName: 'profileId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      });
      userMeta.relations = [profileRel];

      const mockQuery = jest
        .fn()
        .mockResolvedValue([
          { id: 1, fk: 100 },
          { id: 2, fk: 200 },
        ]);
      const mockFind = jest.fn().mockResolvedValue([
        { id: 100, bio: 'bio1' },
        { id: 200, bio: 'bio2' },
      ]);
      const manager = createManager({ query: mockQuery, getRepository: jest.fn().mockReturnValue({ find: mockFind }) });

      const entities: any[] = [{ id: 1 }, { id: 2 }];

      await batchLoadRelations(entities, ['profile'], userMeta as any, manager);

      expect(entities[0].profile).toEqual({ id: 100, bio: 'bio1' });
      expect(entities[1].profile).toEqual({ id: 200, bio: 'bio2' });
    });

    it('assigns null for null FK values', async () => {
      const profileMeta = createMockMetadata({
        target: class Profile {},
        tableName: 'profiles',
        relations: [],
      });
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const profileRel = createMockRelation({
        propertyName: 'profile',
        relationType: 'one-to-one',
        entityMetadata: userMeta,
        inverseEntityMetadata: profileMeta,
        joinColumns: [
          {
            databaseName: 'profileId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      });
      userMeta.relations = [profileRel];

      const mockQuery = jest.fn().mockResolvedValue([{ id: 1, fk: null }]);
      const manager = createManager({
        query: mockQuery,
        getRepository: jest.fn().mockReturnValue({ find: jest.fn().mockResolvedValue([]) }),
      });

      const entities: any[] = [{ id: 1 }];

      await batchLoadRelations(entities, ['profile'], userMeta as any, manager);

      expect(entities[0].profile).toBeNull();
    });
  });

  describe('one-to-many', () => {
    it('loads related entities and groups by parent FK', async () => {
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const postInverseRel = {
        propertyName: 'author',
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      };
      const postMeta = createMockMetadata({
        target: class Post {},
        tableName: 'posts',
        relations: [],
      });
      const postsRel = createMockRelation({
        propertyName: 'posts',
        relationType: 'one-to-many',
        entityMetadata: userMeta,
        inverseEntityMetadata: postMeta,
        inverseRelation: postInverseRel,
      });
      userMeta.relations = [postsRel];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [
            { id: 1, title: 'Post A' },
            { id: 2, title: 'Post B' },
            { id: 3, title: 'Post C' },
          ],
          raw: [
            { t_userId: 10 },
            { t_userId: 10 },
            { t_userId: 20 },
          ],
        }),
      };
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      const manager = createManager({
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
          createQueryBuilder: mockCreateQueryBuilder,
        }),
      });

      const entities: any[] = [{ id: 10 }, { id: 20 }];

      await batchLoadRelations(entities, ['posts'], userMeta as any, manager);

      expect(entities[0].posts).toEqual([
        { id: 1, title: 'Post A' },
        { id: 2, title: 'Post B' },
      ]);
      expect(entities[1].posts).toEqual([{ id: 3, title: 'Post C' }]);
    });

    it('assigns empty array when no related entities exist', async () => {
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const postInverseRel = {
        propertyName: 'author',
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      };
      const postMeta = createMockMetadata({
        target: class Post {},
        tableName: 'posts',
        relations: [],
      });
      const postsRel = createMockRelation({
        propertyName: 'posts',
        relationType: 'one-to-many',
        entityMetadata: userMeta,
        inverseEntityMetadata: postMeta,
        inverseRelation: postInverseRel,
      });
      userMeta.relations = [postsRel];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [],
          raw: [],
        }),
      };
      const mockCreateQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      const manager = createManager({
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
          createQueryBuilder: mockCreateQueryBuilder,
        }),
      });

      const entities: any[] = [{ id: 10 }];

      await batchLoadRelations(entities, ['posts'], userMeta as any, manager);

      expect(entities[0].posts).toEqual([]);
    });
  });

  describe('many-to-many', () => {
    it('loads related entities via junction table and groups by parent', async () => {
      const roleMeta = createMockMetadata({
        target: class Role {},
        tableName: 'roles',
        relations: [],
      });
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const rolesRel = createMockRelation({
        propertyName: 'roles',
        relationType: 'many-to-many',
        entityMetadata: userMeta,
        inverseEntityMetadata: roleMeta,
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
        inverseJoinColumns: [
          {
            databaseName: 'roleId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
        joinTableName: 'user_roles',
        isOwning: true,
      });
      userMeta.relations = [rolesRel];

      const mockQuery = jest.fn().mockResolvedValue([
        { pid: 1, cid: 10 },
        { pid: 1, cid: 20 },
        { pid: 2, cid: 30 },
      ]);
      const mockFind = jest.fn().mockResolvedValue([
        { id: 10, name: 'admin' },
        { id: 20, name: 'editor' },
        { id: 30, name: 'viewer' },
      ]);
      const manager = createManager({ query: mockQuery, getRepository: jest.fn().mockReturnValue({ find: mockFind }) });

      const entities: any[] = [{ id: 1 }, { id: 2 }];

      await batchLoadRelations(entities, ['roles'], userMeta as any, manager);

      expect(entities[0].roles).toEqual([
        { id: 10, name: 'admin' },
        { id: 20, name: 'editor' },
      ]);
      expect(entities[1].roles).toEqual([{ id: 30, name: 'viewer' }]);
    });

    it('assigns empty array when no related entities exist', async () => {
      const roleMeta = createMockMetadata({
        target: class Role {},
        tableName: 'roles',
        relations: [],
      });
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const rolesRel = createMockRelation({
        propertyName: 'roles',
        relationType: 'many-to-many',
        entityMetadata: userMeta,
        inverseEntityMetadata: roleMeta,
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
        inverseJoinColumns: [
          {
            databaseName: 'roleId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
        joinTableName: 'user_roles',
        isOwning: true,
      });
      userMeta.relations = [rolesRel];

      const mockQuery = jest.fn().mockResolvedValue([]);
      const manager = createManager({
        query: mockQuery,
        getRepository: jest.fn().mockReturnValue({ find: jest.fn().mockResolvedValue([]) }),
      });

      const entities: any[] = [{ id: 1 }];

      await batchLoadRelations(entities, ['roles'], userMeta as any, manager);

      expect(entities[0].roles).toEqual([]);
    });
  });

  describe('nested relations', () => {
    it('loads user.profile via nested m2o then o2o', async () => {
      const profileMeta = createMockMetadata({
        target: class Profile {},
        tableName: 'profiles',
        relations: [],
      });
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const profileRel = createMockRelation({
        propertyName: 'profile',
        relationType: 'one-to-one',
        entityMetadata: userMeta,
        inverseEntityMetadata: profileMeta,
        joinColumns: [
          {
            databaseName: 'profileId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      });
      userMeta.relations = [profileRel];

      const commentMeta = createMockMetadata({
        target: class Comment {},
        tableName: 'comments',
        relations: [],
      });
      const userRel = createMockRelation({
        propertyName: 'user',
        relationType: 'many-to-one',
        entityMetadata: commentMeta,
        inverseEntityMetadata: userMeta,
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      });
      commentMeta.relations = [userRel];

      const mockQuery = jest
        .fn()
        .mockResolvedValueOnce([
          { id: 1, fk: 10 },
          { id: 2, fk: 20 },
        ])
        .mockResolvedValueOnce([
          { id: 10, fk: 100 },
          { id: 20, fk: 200 },
        ]);

      const usersRepo = {
        find: jest.fn().mockResolvedValue([
          { id: 10, name: 'Alice' },
          { id: 20, name: 'Bob' },
        ]),
      };
      const profilesRepo = {
        find: jest.fn().mockResolvedValue([
          { id: 100, bio: 'bio1' },
          { id: 200, bio: 'bio2' },
        ]),
      };

      const mockGetRepository = jest.fn((target: any) => {
        if (target === userMeta.target) return usersRepo;
        if (target === profileMeta.target) return profilesRepo;
        return { find: jest.fn().mockResolvedValue([]) };
      });

      const manager = createManager({ query: mockQuery, getRepository: mockGetRepository });

      const entities: any[] = [{ id: 1 }, { id: 2 }];

      await batchLoadRelations(entities, ['user.profile'], commentMeta as any, manager);

      expect(entities[0].user.id).toBe(10);
      expect(entities[0].user.name).toBe('Alice');
      expect(entities[0].user.profile).toEqual({ id: 100, bio: 'bio1' });
      expect(entities[1].user.id).toBe(20);
      expect(entities[1].user.name).toBe('Bob');
      expect(entities[1].user.profile).toEqual({ id: 200, bio: 'bio2' });
    });

    it('loads user.posts via nested m2o then o2m', async () => {
      const userMeta = createMockMetadata({
        target: class User {},
        tableName: 'users',
        relations: [],
      });
      const postInverseRel = {
        propertyName: 'author',
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      };
      const postMeta = createMockMetadata({
        target: class Post {},
        tableName: 'posts',
        relations: [],
      });
      const postsRel = createMockRelation({
        propertyName: 'posts',
        relationType: 'one-to-many',
        entityMetadata: userMeta,
        inverseEntityMetadata: postMeta,
        inverseRelation: postInverseRel,
      });
      userMeta.relations = [postsRel];

      const commentMeta = createMockMetadata({
        target: class Comment {},
        tableName: 'comments',
        relations: [],
      });
      const userRel = createMockRelation({
        propertyName: 'user',
        relationType: 'many-to-one',
        entityMetadata: commentMeta,
        inverseEntityMetadata: userMeta,
        joinColumns: [
          {
            databaseName: 'userId',
            referencedColumn: { propertyName: 'id' },
          },
        ],
      });
      commentMeta.relations = [userRel];

      const mockQuery = jest.fn().mockResolvedValue([
        { id: 1, fk: 10 },
        { id: 2, fk: 20 },
      ]);

      const usersRepo = {
        find: jest.fn().mockResolvedValue([
          { id: 10, name: 'Alice' },
          { id: 20, name: 'Bob' },
        ]),
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          getRawAndEntities: jest.fn().mockResolvedValue({
            entities: [
              { id: 1, title: 'Post A' },
              { id: 2, title: 'Post B' },
              { id: 3, title: 'Post C' },
            ],
            raw: [
              { t_userId: 10 },
              { t_userId: 10 },
              { t_userId: 20 },
            ],
          }),
        }),
      };

      const postsRepo = {
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          getRawAndEntities: jest.fn().mockResolvedValue({
            entities: [
              { id: 1, title: 'Post A' },
              { id: 2, title: 'Post B' },
              { id: 3, title: 'Post C' },
            ],
            raw: [
              { t_userId: 10 },
              { t_userId: 10 },
              { t_userId: 20 },
            ],
          }),
        }),
      };

      const mockGetRepository = jest.fn((target: any) => {
        if (target === userMeta.target) return usersRepo;
        if (target === postMeta.target) return postsRepo;
        return { find: jest.fn().mockResolvedValue([]), createQueryBuilder: jest.fn().mockReturnValue({ where: jest.fn().mockReturnThis(), getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }) }) };
      });

      const manager = createManager({ query: mockQuery, getRepository: mockGetRepository });

      const entities: any[] = [{ id: 1 }, { id: 2 }];

      await batchLoadRelations(entities, ['user.posts'], commentMeta as any, manager);

      expect(entities[0].user.id).toBe(10);
      expect(entities[0].user.name).toBe('Alice');
      expect(entities[0].user.posts).toEqual([
        { id: 1, title: 'Post A' },
        { id: 2, title: 'Post B' },
      ]);
      expect(entities[1].user.id).toBe(20);
      expect(entities[1].user.name).toBe('Bob');
      expect(entities[1].user.posts).toEqual([{ id: 3, title: 'Post C' }]);
    });
  });
});
