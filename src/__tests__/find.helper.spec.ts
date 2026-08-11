import 'reflect-metadata';
import { buildFindWhere, buildCountWhere } from '../common/service/find.helper';
import { BindDto } from '../common/dto/bind.dto';
import { FindDto } from '../common/dto/find.dto';

jest.mock('../common/service/bind-path.service', () => ({
  buildNestedWhere: jest.fn((name, key, id) => {
    if (name.includes('.')) {
      const [first, ...rest] = name.split('.');
      return { [first]: { [rest.join('.')]: { [key]: id } } };
    }
    return { [name]: { [key]: id } };
  }),
}));

jest.mock('../common/service/where.service', () => ({
  parseWhereObject: jest.fn((where) => where || {}),
}));

jest.mock('../common/service/search.service', () => ({
  buildSearchWhere: jest.fn((search) => ({ _search: true })),
  mergeSearchWhere: jest.fn((base, search) => ({ ...base, ...search })),
}));

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

import { buildNestedWhere } from '../common/service/bind-path.service';
import { parseWhereObject } from '../common/service/where.service';
import { buildSearchWhere, mergeSearchWhere } from '../common/service/search.service';

const createBind = (props: Partial<BindDto>): BindDto => Object.assign(new BindDto(), props);
const createFind = (props: Partial<FindDto>): FindDto => Object.assign(new FindDto(), props);

describe('find.helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildFindWhere', () => {
    it('returns empty where with default params', () => {
      const bind = createBind({});
      const find = createFind({});
      const result = buildFindWhere(bind, find);
      expect(result.where).toEqual({});
      expect(result.relationNames).toEqual([]);
      expect(result.useJoin).toBe(false);
      expect(result.isMultiHop).toBe(false);
    });

    it('adds soft delete filter', () => {
      const bind = createBind({});
      const find = createFind({});
      const result = buildFindWhere(bind, find, 'deletedAt');
      expect(result.where.deletedAt).toBeDefined();
    });

    it('adds bind relation filter when id is set', () => {
      const bind = createBind({ id: 5, name: 'user' });
      const find = createFind({});
      const result = buildFindWhere(bind, find);
      expect(buildNestedWhere).toHaveBeenCalledWith('user', 'id', 5);
      expect(result.relationNames).toContain('user');
    });

    it('skips bind filter when allow is true', () => {
      const bind = createBind({ id: 5, name: 'user', allow: true });
      const find = createFind({});
      const result = buildFindWhere(bind, find);
      expect(buildNestedWhere).not.toHaveBeenCalled();
    });

    it('adds tenant filter', () => {
      const bind = createBind({ tenantId: 1, tenantName: 'tenant' });
      const find = createFind({});
      const result = buildFindWhere(bind, find);
      expect(buildNestedWhere).toHaveBeenCalledWith('tenant', 'id', 1);
      expect(result.relationNames).toContain('tenant');
    });

    it('uses custom tenant key', () => {
      const bind = createBind({ tenantId: 't1', tenantName: 'tenant', tenantKey: 'uuid' });
      const find = createFind({});
      buildFindWhere(bind, find);
      expect(buildNestedWhere).toHaveBeenCalledWith('tenant', 'uuid', 't1');
    });

    it('sets useJoin to true when join flag and relations exist', () => {
      const bind = createBind({ id: 1, name: 'user' });
      const find = createFind({ join: true });
      const result = buildFindWhere(bind, find);
      expect(result.useJoin).toBe(true);
    });

    it('does not use join when no relations exist', () => {
      const bind = createBind({});
      const find = createFind({ join: true });
      const result = buildFindWhere(bind, find);
      expect(result.useJoin).toBe(false);
    });

    it('detects multi-hop when bind name contains dot', () => {
      const bind = createBind({ id: 1, name: 'user.team' });
      const find = createFind({});
      const result = buildFindWhere(bind, find);
      expect(result.isMultiHop).toBe(true);
    });

    it('detects multi-hop when tenant name contains dot', () => {
      const bind = createBind({ tenantId: 1, tenantName: 'org.tenant' });
      const find = createFind({});
      const result = buildFindWhere(bind, find);
      expect(result.isMultiHop).toBe(true);
    });

    it('merges search where', () => {
      const find = createFind({} as any);
      (find as any).search = { fields: ['name'], term: 'test' };
      const bind = createBind({});
      buildFindWhere(bind, find);
      expect(buildSearchWhere).toHaveBeenCalled();
      expect(mergeSearchWhere).toHaveBeenCalled();
    });

    it('adds relation from search field with dot notation', () => {
      const find = createFind({} as any);
      (find as any).search = { fields: ['user.name'], term: 'test' };
      const bind = createBind({});
      const result = buildFindWhere(bind, find);
      expect(result.relationNames).toContain('user');
    });

    it('sets take and skip from limit and offset', () => {
      const find = createFind({});
      find.limit = 10;
      find.offset = 5;
      const bind = createBind({});
      const result = buildFindWhere(bind, find);
      expect(result.params.take).toBe(10);
      expect(result.params.skip).toBe(5);
    });

    it('passes where through parseWhereObject', () => {
      const find = createFind({ where: { status: 'active' } } as any);
      const bind = createBind({});
      buildFindWhere(bind, find);
      expect(parseWhereObject).toHaveBeenCalledWith({ status: 'active' });
    });

    it('does not duplicate relation name from bind', () => {
      const find = createFind({ relations: [{ name: 'user' }] });
      const bind = createBind({ id: 1, name: 'user' });
      const result = buildFindWhere(bind, find);
      const userCount = result.relationNames.filter((n) => n === 'user').length;
      expect(userCount).toBe(1);
    });
  });

  describe('buildCountWhere', () => {
    it('returns empty where with default params', () => {
      const bind = createBind({});
      const find = createFind({});
      const result = buildCountWhere(bind, find);
      expect(result.where).toEqual({});
      expect(result.relationNames).toEqual([]);
    });

    it('adds soft delete filter', () => {
      const bind = createBind({});
      const find = createFind({});
      const result = buildCountWhere(bind, find, 'deletedAt');
      expect(result.where.deletedAt).toBeDefined();
    });

    it('adds bind filter when id is set', () => {
      const bind = createBind({ id: 5, name: 'user' });
      const find = createFind({});
      const result = buildCountWhere(bind, find);
      expect(result.relationNames).toEqual([]);
    });

    it('adds relation name for multi-hop bind', () => {
      const bind = createBind({ id: 1, name: 'user.team' });
      const find = createFind({});
      const result = buildCountWhere(bind, find);
      expect(result.relationNames).toContain('user');
    });

    it('adds relation name for multi-hop tenant', () => {
      const bind = createBind({ tenantId: 1, tenantName: 'org.tenant' });
      const find = createFind({});
      const result = buildCountWhere(bind, find);
      expect(result.relationNames).toContain('org');
    });

    it('merges search where', () => {
      const find = createFind({} as any);
      (find as any).search = { fields: ['name'], term: 'test' };
      const bind = createBind({});
      buildCountWhere(bind, find);
      expect(buildSearchWhere).toHaveBeenCalled();
      expect(mergeSearchWhere).toHaveBeenCalled();
    });

    it('skips bind filter when allow is true', () => {
      const bind = createBind({ id: 5, name: 'user', allow: true });
      const find = createFind({});
      const result = buildCountWhere(bind, find);
      expect(buildNestedWhere).not.toHaveBeenCalled();
    });
  });
});
