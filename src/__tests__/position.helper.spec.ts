import 'reflect-metadata';
import { executeSortPosition, executeMovePosition } from '../common/service/position.helper';
import { BindDto } from '../common/dto/bind.dto';
import { FindDto } from '../common/dto/find.dto';
import { EntityMetadata, EntityManager } from 'typeorm';

jest.mock('../common/service/bind-resolve.helper', () => ({
  resolveBindRelationId: jest.fn().mockResolvedValue(1),
}));

jest.mock('../common/service/where.service', () => ({
  parseWhereObject: jest.fn((where) => where || {}),
}));

import { resolveBindRelationId } from '../common/service/bind-resolve.helper';

const createBind = (props: Partial<BindDto>): BindDto => Object.assign(new BindDto(), props);
const createFind = (props: Partial<FindDto>): FindDto => Object.assign(new FindDto(), props);

const createMockManager = () => {
  const updates: any[] = [];
  const saves: any[] = [];
  const manager = {
    update: jest.fn((target, where, set) => {
      updates.push({ target, where, set });
      return { affected: 1 };
    }),
    save: jest.fn((target, entries) => {
      saves.push({ target, entries });
      return entries;
    }),
    getRepository: jest.fn().mockReturnValue({ metadata: {} }),
  };
  return { manager: manager as unknown as EntityManager, updates, saves };
};

describe('position.helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeSortPosition', () => {
    it('assigns sequential positions to entries', async () => {
      const { manager, saves } = createMockManager();
      const entries: any[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const find = createFind({});
      const bind = createBind({});
      const metadata = {} as EntityMetadata;

      const result = await executeSortPosition('Entity', 'pos', entries, find, bind, metadata, manager);

      expect(result).toBe(true);
      expect(entries[0].pos).toBe(1);
      expect(entries[1].pos).toBe(2);
      expect(entries[2].pos).toBe(3);
      expect(saves.length).toBe(1);
    });

    it('resets positions to 0 with where filter', async () => {
      const { manager, updates } = createMockManager();
      const entries: any[] = [{ id: 1 }];
      const find = createFind({ where: { status: 'active' } } as any);
      const bind = createBind({});
      const metadata = {} as EntityMetadata;

      await executeSortPosition('Entity', 'pos', entries, find, bind, metadata, manager);

      expect(updates[0].set).toEqual({ pos: 0 });
    });

    it('resets positions when bind.id is set', async () => {
      const { manager, updates } = createMockManager();
      const entries: any[] = [{ id: 1 }];
      const find = createFind({});
      const bind = createBind({ id: 5, name: 'user' });
      const metadata = {} as EntityMetadata;

      await executeSortPosition('Entity', 'pos', entries, find, bind, metadata, manager);

      expect(updates[0].set).toEqual({ pos: 0 });
    });

    it('resets positions with tenant filter', async () => {
      const { manager, updates } = createMockManager();
      const entries: any[] = [{ id: 1 }];
      const find = createFind({});
      const bind = createBind({ tenantId: 1, tenantName: 'tenant' });
      const metadata = {} as EntityMetadata;

      await executeSortPosition('Entity', 'pos', entries, find, bind, metadata, manager);

      expect(updates[0].set).toEqual({ pos: 0 });
    });

    it('throws when limit/offset without where or bind', async () => {
      const { manager } = createMockManager();
      const entries: any[] = [{ id: 1 }];
      const find = createFind({ limit: 10, offset: 0 });
      const bind = createBind({});
      const metadata = {} as EntityMetadata;

      await expect(
        executeSortPosition('Entity', 'pos', entries, find, bind, metadata, manager),
      ).rejects.toThrow('sortPosition with limit/offset requires a where filter or bind to scope the reset');
    });

    it('does not reset when no where, no bind, no limit/offset', async () => {
      const { manager, updates } = createMockManager();
      const entries: any[] = [{ id: 1 }];
      const find = createFind({});
      const bind = createBind({});
      const metadata = {} as EntityMetadata;

      await executeSortPosition('Entity', 'pos', entries, find, bind, metadata, manager);

      expect(updates.length).toBe(0);
    });
  });

  describe('executeMovePosition', () => {
    it('does nothing when old equals new position', async () => {
      const { manager, updates } = createMockManager();
      await executeMovePosition('Entity', 1, 'pos', 5, 5, 5, manager);
      expect(updates.length).toBe(0);
    });

    it('shifts positions up when moving to lower position', async () => {
      const { manager, updates } = createMockManager();
      await executeMovePosition('Entity', 1, 'pos', 2, 5, 2, manager);
      expect(updates.length).toBe(2);
      expect(updates[0].where).toBeDefined();
      expect(updates[1].where).toBe(1);
      expect(updates[1].set).toEqual({ pos: 2 });
    });

    it('shifts positions down when moving to higher position', async () => {
      const { manager, updates } = createMockManager();
      await executeMovePosition('Entity', 1, 'pos', 5, 2, 5, manager);
      expect(updates.length).toBe(2);
      expect(updates[1].set).toEqual({ pos: 5 });
    });
  });
});
