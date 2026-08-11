import { In, IsNull, Repository } from 'typeorm';
import { BaseEntity } from 'typeorm';
import { buildNestedWhere } from './bind-path.service';
import { parseWhereObject } from './where.service';
import { buildSearchWhere, mergeSearchWhere } from './search.service';
import { BindDto } from '../dto/bind.dto';
import { FindDto } from '../dto/find.dto';
import { relationsOrder } from './relations.service';
import { filterNestedRelations } from './nested_filter.service';
import { removePrivateFields } from './private_fields.service';
import { batchLoadRelations } from './batch-loader.service';

interface FindParams {
  where: any;
  relations?: string[];
  take?: number;
  skip?: number;
  select?: any;
  order?: any;
}

export interface BuildFindResult {
  where: any;
  relationNames: string[];
  useJoin: boolean;
  params: FindParams;
  isMultiHop: boolean;
}

export function buildFindWhere(
  bind: BindDto,
  find: FindDto,
  softDeleteCol?: string | null,
): BuildFindResult {
  const { id, name, key = 'id', allow, tenantId, tenantName, tenantKey = 'id' } = bind;
  const { relations, search, join = false, ...otherParams } = find;

  let where = parseWhereObject(find.where);

  if (softDeleteCol) {
    where = { ...where, [softDeleteCol]: IsNull() } as any;
  }

  if (id !== undefined && !allow) {
    where = { ...where, ...buildNestedWhere(name, key, id) };
  }

  if (tenantId !== undefined && tenantName && !allow) {
    where = { ...where, ...buildNestedWhere(tenantName, tenantKey, tenantId) };
  }

  const relationNames = relations?.map((i) => i.name) || [];
  if (id !== undefined && !name.includes('.') && !relationNames.includes(name)) {
    relationNames.push(name);
  }
  if (tenantId !== undefined && tenantName && !tenantName.includes('.') && !relationNames.includes(tenantName)) {
    relationNames.push(tenantName);
  }

  if (search) {
    const searchWhere = buildSearchWhere(search);
    where = mergeSearchWhere(where, searchWhere);
    for (const field of search.fields) {
      if (field.includes('.')) {
        const firstSegment = field.split('.')[0];
        if (!relationNames.includes(firstSegment)) {
          relationNames.push(firstSegment);
        }
      }
    }
  }

  const useJoin = join && relationNames.length > 0;
  const isMultiHop =
    (id !== undefined && !allow && name.includes('.')) ||
    (tenantId !== undefined && !allow && tenantName?.includes('.'));

  const params: FindParams = {
    ...otherParams,
    relations: useJoin ? relationNames : undefined,
    where,
    take: (find as any).limit || undefined,
    skip: (find as any).offset || undefined,
  };

  return { where, relationNames, useJoin, params, isMultiHop };
}

export function buildCountWhere(
  bind: BindDto,
  find: FindDto,
  softDeleteCol?: string | null,
): { where: any; relationNames: string[] } {
  const { id, name, key = 'id', allow, tenantId, tenantName, tenantKey = 'id' } = bind;

  let where = parseWhereObject(find.where);

  if (softDeleteCol) {
    where = { ...where, [softDeleteCol]: IsNull() } as any;
  }

  const relationNames: string[] = [];

  if (id !== undefined && !allow) {
    where = { ...where, ...buildNestedWhere(name, key, id) };
    if (name.includes('.')) relationNames.push(name.split('.')[0]);
  }

  if (tenantId !== undefined && tenantName && !allow) {
    where = { ...where, ...buildNestedWhere(tenantName, tenantKey, tenantId) };
    if (tenantName.includes('.') && !relationNames.includes(tenantName.split('.')[0])) {
      relationNames.push(tenantName.split('.')[0]);
    }
  }

  if (find.search) {
    const searchWhere = buildSearchWhere(find.search);
    where = mergeSearchWhere(where, searchWhere);
    for (const field of find.search.fields) {
      if (field.includes('.')) {
        const firstSegment = field.split('.')[0];
        if (!relationNames.includes(firstSegment)) {
          relationNames.push(firstSegment);
        }
      }
    }
  }

  return { where, relationNames };
}

export async function executeFind<Entity extends BaseEntity>(
  repository: Repository<Entity>,
  find: FindDto,
  bindResult: BuildFindResult,
  bind: BindDto,
): Promise<Entity[]> {
  const { relationNames, useJoin, params, isMultiHop } = bindResult;
  const take = (find as any).limit;
  const skip = (find as any).offset;

  let result: Entity[];

  const hasPagination = !!(take || skip);

  if (isMultiHop && hasPagination) {
    const idResults = await repository.find({
      ...params,
      select: { id: true } as any,
    });
    const uniqueIds: any[] = [];
    const seenIds = new Set();
    for (const r of idResults as any[]) {
      const rid = String(r.id);
      if (!seenIds.has(rid)) {
        seenIds.add(rid);
        uniqueIds.push(r.id);
      }
    }
    const offsetNum = skip || 0;
    const limitNum = take || uniqueIds.length;
    const paginatedIds = uniqueIds.slice(offsetNum, offsetNum + limitNum);
    if (paginatedIds.length === 0) {
      result = [];
    } else {
      result = await repository.find({
        ...params,
        relations: useJoin ? relationNames : undefined,
        where: { id: In(paginatedIds) } as any,
      });
    }
  } else {
    result = await repository.find(params);
  }

  if (!useJoin && relationNames.length > 0 && result.length > 0) {
    await batchLoadRelations(result, relationNames, repository.metadata, repository.manager);
  }

  result = relationsOrder(result, find.relations) as Entity[];

  if (isMultiHop) {
    const seen = new Set();
    result = result.filter((item: any) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  filterNestedRelations(result, bind);
  result = removePrivateFields(result, bind, bind) as Entity[];
  return result;
}
