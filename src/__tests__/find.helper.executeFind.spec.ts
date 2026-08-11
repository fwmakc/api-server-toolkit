import 'reflect-metadata';
import { executeFind } from '../common/service/find.helper';
import { buildFindWhere, BuildFindResult } from '../common/service/find.helper';
import { BindDto } from '../common/dto/bind.dto';
import { FindDto } from '../common/dto/find.dto';
import { Repository } from 'typeorm';

jest.mock('../common/service/batch-loader.service', () => ({
  batchLoadRelations: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../common/service/relations.service', () => ({
  relationsOrder: jest.fn((items) => items),
}));

jest.mock('../common/service/nested_filter.service', () => ({
  filterNestedRelations: jest.fn(),
}));

jest.mock('../common/service/private_fields.service', () => ({
  removePrivateFields: jest.fn((items) => items),
}));

import { batchLoadRelations } from '../common/service/batch-loader.service';
import { relationsOrder } from '../common/service/relations.service';
import { filterNestedRelations } from '../common/service/nested_filter.service';
import { removePrivateFields } from '../common/service/private_fields.service';

const createBind = (props: Partial<BindDto>): BindDto => Object.assign(new BindDto(), props);
const createFind = (props: Partial<FindDto>): FindDto => Object.assign(new FindDto(), props);

function createMockRepository(findResults: any[][]): Repository<any> {
  let callIndex = 0;
  return {
    find: jest.fn().mockImplementation((options) => {
      return findResults[callIndex++] || [];
    }),
    metadata: { columns: [], relations: [], indices: [] },
    manager: {},
  } as unknown as Repository<any>;
}

describe('find.helper — executeFind', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds entities and returns them', async () => {
    const entities = [{ id: 1, name: 'test' }];
    const repo = createMockRepository([entities]);
    const find = createFind({});
    const bind = createBind({});
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: [],
      useJoin: false,
      params: { where: {}, relations: undefined, take: undefined, skip: undefined },
      isMultiHop: false,
    };

    const result = await executeFind(repo, find, bindResult, bind);
    expect(result).toEqual(entities);
  });

  it('calls batchLoadRelations when useJoin is false and relations exist', async () => {
    const entities = [{ id: 1, user: { id: 2 } }];
    const repo = createMockRepository([entities]);
    const find = createFind({ relations: [{ name: 'user' }] });
    const bind = createBind({});
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: ['user'],
      useJoin: false,
      params: { where: {}, relations: undefined, take: undefined, skip: undefined },
      isMultiHop: false,
    };

    await executeFind(repo, find, bindResult, bind);
    expect(batchLoadRelations).toHaveBeenCalledWith(entities, ['user'], expect.any(Object), expect.any(Object));
  });

  it('does not call batchLoadRelations when useJoin is true', async () => {
    const entities = [{ id: 1 }];
    const repo = createMockRepository([entities]);
    const find = createFind({});
    const bind = createBind({});
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: ['user'],
      useJoin: true,
      params: { where: {}, relations: ['user'], take: undefined, skip: undefined },
      isMultiHop: false,
    };

    await executeFind(repo, find, bindResult, bind);
    expect(batchLoadRelations).not.toHaveBeenCalled();
  });

  it('deduplicates multi-hop results', async () => {
    const entities = [{ id: 1 }, { id: 2 }, { id: 1 }];
    const repo = createMockRepository([entities]);
    const find = createFind({});
    const bind = createBind({});
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: [],
      useJoin: false,
      params: { where: {}, relations: undefined, take: undefined, skip: undefined },
      isMultiHop: true,
    };

    const result = await executeFind(repo, find, bindResult, bind);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('handles multi-hop with pagination — two-phase query', async () => {
    const idResults = [{ id: 3 }, { id: 1 }, { id: 2 }, { id: 1 }];
    const fullResults = [{ id: 3, name: 'c' }, { id: 1, name: 'a' }];
    const repo = createMockRepository([idResults, fullResults]);
    const find = createFind({ limit: 2, offset: 0 });
    const bind = createBind({});
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: [],
      useJoin: false,
      params: { where: {}, relations: undefined, take: 2, skip: 0 },
      isMultiHop: true,
    };

    const result = await executeFind(repo, find, bindResult, bind);
    expect(result).toHaveLength(2);
  });

  it('returns empty for multi-hop with no paginated ids', async () => {
    const repo = createMockRepository([[]]);
    const find = createFind({ limit: 10, offset: 100 });
    const bind = createBind({});
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: [],
      useJoin: false,
      params: { where: {}, relations: undefined, take: 10, skip: 100 },
      isMultiHop: true,
    };

    const result = await executeFind(repo, find, bindResult, bind);
    expect(result).toEqual([]);
  });

  it('calls filterNestedRelations and removePrivateFields', async () => {
    const entities = [{ id: 1 }];
    const repo = createMockRepository([entities]);
    const find = createFind({});
    const bind = createBind({ id: 1, name: 'user' });
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: [],
      useJoin: false,
      params: { where: {}, relations: undefined, take: undefined, skip: undefined },
      isMultiHop: false,
    };

    await executeFind(repo, find, bindResult, bind);
    expect(filterNestedRelations).toHaveBeenCalled();
    expect(removePrivateFields).toHaveBeenCalled();
  });

  it('calls relationsOrder with find.relations', async () => {
    const entities = [{ id: 1 }];
    const repo = createMockRepository([entities]);
    const relations = [{ name: 'user', order: 'asc' }];
    const find = createFind({ relations });
    const bind = createBind({});
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: ['user'],
      useJoin: false,
      params: { where: {}, relations: undefined, take: undefined, skip: undefined },
      isMultiHop: false,
    };

    await executeFind(repo, find, bindResult, bind);
    expect(relationsOrder).toHaveBeenCalledWith(expect.any(Array), relations);
  });

  it('returns empty array when no results', async () => {
    const repo = createMockRepository([[]]);
    const find = createFind({});
    const bind = createBind({});
    const bindResult: BuildFindResult = {
      where: {},
      relationNames: [],
      useJoin: false,
      params: { where: {}, relations: undefined, take: undefined, skip: undefined },
      isMultiHop: false,
    };

    const result = await executeFind(repo, find, bindResult, bind);
    expect(result).toEqual([]);
  });
});
