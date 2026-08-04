import { BadRequestException, NotFoundException } from '@nestjs/common';
import { throwDbError } from './service/error.service';
import {
  And,
  BaseEntity,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { RelationsDto } from './dto/relations.dto';
import { relationsOrder } from './service/relations.service';
import { CommonDto } from './common.dto';
import { FindDto } from './dto/find.dto';
import { FindManyDto } from './dto/find_many.dto';
import { FindOneDto } from './dto/find_one.dto';
import { parseWhereObject } from './service/where.service';
import {
  removePrivateFields,
  stripWriteFields,
} from './service/private_fields.service';
import { sanitizeForSave } from './service/sanitize.service';
import { filterNestedRelations } from './service/nested_filter.service';
import { buildSearchWhere, mergeSearchWhere } from './service/search.service';
import { bind } from './service/bind.service';
import { OWNER_TABLE } from './service/owner.service';
import { BindDto } from './dto/bind.dto';
import { batchLoadRelations } from './service/batch-loader.service';

export class CommonService<Dto extends CommonDto, Entity extends BaseEntity> {
  protected readonly repository: Repository<Entity>;

  async find(
    find: FindDto = {},
    bind: BindDto = { allow: true },
  ): Promise<Entity[]> {
    const {
      relations,
      limit: take,
      offset: skip,
      search,
      join = false,
      ...otherParams
    } = find;

    const { id, name, key = 'id', allow, tenantId, tenantName, tenantKey = 'id' } = bind;

    let where = parseWhereObject(find.where);
    // "username.not.like": "%user%"
    // "username.and.not.like": ["%user1%", "%user2%"]

    if (id !== undefined && !allow) {
      const bindValue = { [key]: id };
      if (name.includes('.')) {
        const segments = name.split('.');
        let nested: any = bindValue;
        for (let i = segments.length - 1; i >= 0; i--) {
          nested = { [segments[i]]: nested };
        }
        where = { ...where, ...nested };
      } else {
        where = { ...where, [name]: bindValue };
      }
    }

    if (tenantId !== undefined && tenantName && !allow) {
      const tenantBindValue = { [tenantKey]: tenantId };
      if (tenantName.includes('.')) {
        const segments = tenantName.split('.');
        let nested: any = tenantBindValue;
        for (let i = segments.length - 1; i >= 0; i--) {
          nested = { [segments[i]]: nested };
        }
        where = { ...where, ...nested };
      } else {
        where = { ...where, [tenantName]: tenantBindValue };
      }
    }

    const relationNames = relations?.map((i) => i.name) || [];
    if (
      id !== undefined &&
      !name.includes('.') &&
      !relationNames.includes(name)
    ) {
      relationNames.push(name);
    }
    if (
      tenantId !== undefined &&
      tenantName &&
      !tenantName.includes('.') &&
      !relationNames.includes(tenantName)
    ) {
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
    const params = {
      ...otherParams,
      relations: useJoin ? relationNames : undefined,
      where,
      take: take || undefined,
      skip: skip || undefined,
    };

    try {
      let result;

      const isMultiHop =
        (id !== undefined && !allow && name.includes('.')) ||
        (tenantId !== undefined && !allow && tenantName?.includes('.'));
      const hasPagination = !!(take || skip);

      if (isMultiHop && hasPagination) {
        const idResults = await this.repository.find({
          ...otherParams,
          where,
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
          result = await this.repository.find({
            ...otherParams,
            relations: useJoin ? relationNames : undefined,
            where: { id: In(paginatedIds) } as any,
          });
        }
      } else {
        result = await this.repository.find(params);
      }

      if (!useJoin && relationNames.length > 0 && result.length > 0) {
        await batchLoadRelations(
          result,
          relationNames,
          this.repository.metadata,
          this.repository.manager,
        );
      }

      result = relationsOrder(result, relations);

      if (
        (id !== undefined && !allow && name.includes('.')) ||
        (tenantId !== undefined && !allow && tenantName?.includes('.'))
      ) {
        const seen = new Set();
        result = result.filter((item: any) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      }

      filterNestedRelations(result, bind);
      result = removePrivateFields(result, bind);
      return result;
    } catch (e) {
      this.error(e);
    }
  }

  async findFirst(
    find: FindDto,
    bind: BindDto = { allow: true },
  ): Promise<Entity> {
    const [result] = await this.find(
      {
        ...find,
        limit: 1,
      },
      bind,
    );
    return result;
  }

  async findMany(
    findMany: FindManyDto,
    bind: BindDto = { allow: true },
  ): Promise<Entity[]> {
    const { ids, ...find } = findMany;
    const order: FindOptionsOrder<any> = { id: 'ASC' };
    const where: FindOptionsWhere<any> = {
      id: In(ids?.map((i) => Number(i) || 0)),
    };
    return await this.find(
      {
        ...find,
        order,
        where,
        limit: 0,
        offset: 0,
      },
      bind,
    );
  }

  async findOne(
    findOne: FindOneDto,
    bind: BindDto = { allow: true },
  ): Promise<Entity> {
    const { id, ...find } = findOne;
    const where: FindOptionsWhere<any> = { ...find.where, id };
    const [result] = await this.find(
      {
        ...find,
        where,
        limit: 1,
        offset: 0,
      },
      bind,
    );
    return result;
  }

  async count(find: FindDto, bind: BindDto = { allow: true }): Promise<number> {
    const { id, name, key = 'id', allow, tenantId, tenantName, tenantKey = 'id' } = bind;

    let where = parseWhereObject(find.where);
    const relationNames: string[] = [];

    if (id !== undefined && !allow) {
      const bindValue = { [key]: id };
      if (name.includes('.')) {
        const segments = name.split('.');
        let nested: any = bindValue;
        for (let i = segments.length - 1; i >= 0; i--) {
          nested = { [segments[i]]: nested };
        }
        where = { ...where, ...nested };
        relationNames.push(segments[0]);
      } else {
        where = { ...where, [name]: bindValue };
      }
    }

    if (tenantId !== undefined && tenantName && !allow) {
      const tenantBindValue = { [tenantKey]: tenantId };
      if (tenantName.includes('.')) {
        const segments = tenantName.split('.');
        let nested: any = tenantBindValue;
        for (let i = segments.length - 1; i >= 0; i--) {
          nested = { [segments[i]]: nested };
        }
        where = { ...where, ...nested };
        if (!relationNames.includes(segments[0])) {
          relationNames.push(segments[0]);
        }
      } else {
        where = { ...where, [tenantName]: tenantBindValue };
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

    return await this.repository.count({
      where,
      ...(relationNames.length > 0 ? { relations: relationNames } : {}),
    });
  }

  async countDistinct(field: string, find: FindDto): Promise<number> {
    const qb = this.repository.createQueryBuilder('t');

    const where = parseWhereObject(find.where);
    if (where) qb.where(where);

    const result = await qb
      .select(`COUNT(DISTINCT t.${field})`, 'count')
      .getRawOne();

    return Number(result?.count || 0);
  }

  async create(
    dto: Dto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
    externalManager?: EntityManager,
  ): Promise<Entity> {
    // next this columns from bind
    delete dto.id;

    const entity: DeepPartial<any> = { ...dto };

    stripWriteFields(entity, this.repository.metadata.target, bind);

    try {
      let savedId: any;

      const doCreate = async (manager: EntityManager) => {
        if (bind.id !== undefined && !bind.allow) {
          const autoAssign = await this.resolveAutoAssign(bind, manager);
          if (autoAssign) {
            entity[autoAssign.name] = { id: autoAssign.id };
          }
        }

        if (
          bind.tenantId !== undefined &&
          !bind.allow &&
          bind.tenantName &&
          !bind.tenantName.includes('.')
        ) {
          entity[bind.tenantName] = { id: bind.tenantId };
        }

        await sanitizeForSave(entity, this.repository.metadata, bind, manager);

        const result = await this.createEntity(entity, manager);
        savedId = result?.id;
      };

      if (externalManager) {
        await doCreate(externalManager);
      } else {
        await this.repository.manager.transaction(doCreate);
      }

      return await this.findOne(
        {
          id: savedId,
          relations,
        },
        bind,
      );
    } catch (e) {
      this.error(e);
    }
  }

  async createEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any> {
    const repo = manager ? manager.getRepository(this.repository.target) : this.repository;
    return await repo.save(entity);
  }

  getUniqueColumns(): Array<string> {
    const uniques: Array<string> = [];
    this.repository.metadata.indices.forEach((index) => {
      if (index.isUnique) {
        const name = index.columns?.[0]?.propertyName;
        if (name) {
          uniques.push(name);
        }
      }
    });
    return uniques;
  }

  async findUniqueEntrie(entity: DeepPartial<any>): Promise<any> {
    const uniques = this.getUniqueColumns();
    if (uniques.length === 0) {
      return null;
    }

    const where = uniques
      .filter((field) => entity[field] !== undefined && entity[field] !== null)
      .map((field) => ({ [field]: entity[field] }));

    if (where.length === 0) {
      return null;
    }

    return await this.repository.findOne({
      select: { id: true } as any,
      where: where as any,
    });
  }

  async upsert(
    dto: Dto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
  ): Promise<Entity> {
    delete dto.id;

    const entity: DeepPartial<any> = { ...dto };

    if (bind.id !== undefined && !bind.allow) {
      const autoAssign = await this.resolveAutoAssign(bind);
      if (autoAssign) {
        entity[autoAssign.name] = { id: autoAssign.id };
      }
    }

    const existsEntrie = await this.findUniqueEntrie(entity);

    if (existsEntrie?.id) {
      return await this.update(existsEntrie.id, dto, relations, bind);
    }

    try {
      return await this.create(dto, relations, bind);
    } catch (e) {
      if (e?.code === '23505') {
        const retryEntrie = await this.findUniqueEntrie(entity);
        if (retryEntrie?.id) {
          return await this.update(retryEntrie.id, dto, relations, bind);
        }
      }
      this.error(e);
    }
  }

  async update(
    id: number | string,
    dto: Dto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
    externalManager?: EntityManager,
  ): Promise<Entity> {
    if (id === undefined) {
      return;
    }

    const exists = await this.findOne({ id, select: { id: true } }, bind);
    if (!exists) {
      return;
    }

    const entity: DeepPartial<any> = { ...dto, id };

    stripWriteFields(entity, this.repository.metadata.target, bind);

    try {
      const doUpdate = async (manager: EntityManager) => {
        await sanitizeForSave(entity, this.repository.metadata, bind, manager);
        await this.updateEntity(entity, manager);
      };

      if (externalManager) {
        await doUpdate(externalManager);
      } else {
        await this.repository.manager.transaction(doUpdate);
      }

      return await this.findOne(
        {
          id,
          relations,
        },
        bind,
      );
    } catch (e) {
      this.error(e);
    }
  }

  async updateEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any> {
    const idType = this.getIdType();
    entity.id = idType === 'bigint' ? `${entity.id}` : +entity.id;
    const repo = manager ? manager.getRepository(this.repository.target) : this.repository;
    return await repo.save(entity);
  }

  getIdType(): string {
    const column: DeepPartial<any> = this.repository.metadata.columns.find(
      (column) => column.propertyName === 'id',
    );
    return column?.type || 'int';
  }

  private async resolveBindRelationId(
    bind: BindDto,
    manager?: EntityManager,
  ): Promise<number | string | null> {
    const key = bind.key || 'id';
    if (key === 'id') {
      return bind.id;
    }
    const name = bind.name || OWNER_TABLE;
    const segments = name.split('.');
    let currentMetadata = this.repository.metadata;
    for (const segment of segments) {
      const relation = currentMetadata.relations.find(
        (r) => r.propertyName === segment,
      );
      if (!relation) {
        return null;
      }
      currentMetadata = relation.inverseEntityMetadata;
    }
    const relatedRepo = (manager ?? this.repository.manager).getRepository(
      currentMetadata.target,
    );
    const related = await relatedRepo.findOne({
      where: { [key]: bind.id } as any,
    });
    return related ? related.id : null;
  }

  private async resolveAutoAssign(
    bind: BindDto,
    manager?: EntityManager,
  ): Promise<{ name: string; id: number | string } | null> {
    if (bind.id === undefined) return null;

    const name = bind.name || OWNER_TABLE;
    const segments = name.split('.');

    if (segments.length === 1) {
      const resolvedId = await this.resolveBindRelationId(bind, manager);
      return resolvedId !== null
        ? { name: segments[0], id: resolvedId }
        : null;
    }

    const firstSegment = segments[0];
    const relation = this.repository.metadata.relations.find(
      (r) => r.propertyName === firstSegment,
    );
    if (!relation) return null;

    if (
      relation.relationType !== 'many-to-one' &&
      relation.relationType !== 'one-to-one'
    ) {
      return null;
    }

    const key = bind.key || 'id';
    let nestedWhere: any = { [key]: bind.id };
    for (let i = segments.length - 1; i > 0; i--) {
      nestedWhere = { [segments[i]]: nestedWhere };
    }

    const firstRepo = (manager ?? this.repository.manager).getRepository(
      relation.inverseEntityMetadata.target,
    );

    const result = await firstRepo.findOne({
      where: nestedWhere,
      select: { id: true } as any,
    });

    if (!result) {
      throw new NotFoundException(
        `Entity not found for auto-assign path: ${firstSegment}`,
      );
    }

    return { name: firstSegment, id: result.id };
  }

  async remove(id: number | string, bind: BindDto = { allow: true }, externalManager?: EntityManager): Promise<boolean> {
    if (bind.id !== undefined && !bind.allow) {
      const find = await this.findOne({ id, select: { id: true } }, bind);
      if (!find) {
        return false;
      }
    }
    try {
      const repo = externalManager ? externalManager.getRepository(this.repository.target) : this.repository;
      const result = await repo.delete(id);
      return !!result?.affected;
    } catch (e) {
      this.error(e);
    }
  }

  async sortPosition(
    field: string,
    find: FindDto,
    bind: BindDto = { allow: true },
  ): Promise<boolean> {
    this.validatePositionField(field);

    if (!find.order) {
      find.order = { [field]: 'asc', id: 'asc' } as FindOptionsOrder<any>;
    }

    const entries = await this.find(
      { ...find, select: { id: true, [field]: true } as any, relations: undefined },
      bind,
    );

    if (!entries) {
      return;
    }

    if (typeof entries?.[0]?.[field] !== 'number') {
      this.error({ message: 'cannot position by non-numeric field' });
    }

    try {
      await this.repository.manager.transaction(
        async (transactionalManager) => {
          const entityTarget: EntityTarget<Entity> = this.repository.target;

          let resetWhere: any = {};
          if (find.where) {
            resetWhere = parseWhereObject(find.where);
          }
          if (bind.id !== undefined) {
            const resolvedId = await this.resolveBindRelationId(bind);
            resetWhere = {
              ...resetWhere,
              [bind.name || OWNER_TABLE]:
                resolvedId !== null
                  ? { id: resolvedId }
                  : { [bind.key || 'id']: bind.id },
            };
          }
          if (
            bind.tenantId !== undefined &&
            bind.tenantName &&
            !bind.allow
          ) {
            resetWhere = {
              ...resetWhere,
              [bind.tenantName]: {
                [bind.tenantKey || 'id']: bind.tenantId,
              },
            };
          }
          if (Object.keys(resetWhere).length > 0) {
            await transactionalManager.update(entityTarget, resetWhere, {
              [field]: 0,
            } as DeepPartial<any>);
          } else if (find.limit || find.offset) {
            throw new BadRequestException(
              'sortPosition with limit/offset requires a where filter or bind to scope the reset',
            );
          }

          entries.forEach((entrie, index) => {
            entrie[field] = index + 1;
          });

          await transactionalManager.save(entityTarget, entries);
        },
      );

      return true;
    } catch (e) {
      this.error(e);
    }
  }

  async movePosition(
    id: number | string,
    field: string,
    position: number,
    bind: BindDto = { allow: true },
  ): Promise<boolean> {
    this.validatePositionField(field);

    if (position === undefined || position === null) {
      return false;
    }

    const [entrie, lastEntrie] = await Promise.all([
      this.findOne(
        { id, select: { [field]: true } },
        bind,
      ),
      this.findFirst(
        { select: { id: true, [field]: true }, order: { [field]: 'DESC' } },
        bind,
      ),
    ]);

    if (!entrie) {
      return false;
    }

    if (typeof entrie[field] !== 'number') {
      this.error({ message: 'cannot position by non-numeric field' });
    }

    const lastPosition = +(lastEntrie as any)?.[field] || 0;

    if (position < 0 || position > lastPosition + 1) {
      if (String(id) === String((lastEntrie as any)?.id)) {
        return false;
      }
      position = lastPosition + 1;
    }

    try {
      const oldPosition = +entrie[field] || 0;
      const newPosition = +position || 0;

      if (oldPosition === newPosition) {
        return false;
      }

      await this.repository.manager.transaction(
        async (transactionalManager) => {
          const entityTarget: EntityTarget<Entity> = this.repository.target;

          const updateEntries: DeepPartial<any> = {
            [field]: () =>
              oldPosition > newPosition ? `${field} + 1` : `${field} - 1`,
          };

          const whereEntries: DeepPartial<any> = {
            [field]:
              oldPosition > newPosition
                ? And(MoreThanOrEqual(newPosition), LessThan(oldPosition))
                : And(MoreThan(oldPosition), LessThanOrEqual(newPosition)),
          };

          await transactionalManager.update(
            entityTarget,
            whereEntries,
            updateEntries,
          );

          const updateCurrentEntrie: DeepPartial<any> = {
            [field]: newPosition,
          };
          await transactionalManager.update(
            entityTarget,
            id,
            updateCurrentEntrie,
          );
        },
      );

      return true;
    } catch (e) {
      this.error(e);
    }
  }

  bind(entrie, data) {
    return bind(entrie, data);
  }

  private validatePositionField(field: string) {
    if (!field || typeof field !== 'string') {
      throw new BadRequestException('Field name is required');
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new BadRequestException(`Invalid field name: ${field}`);
    }
    const primaryColumns = this.repository.metadata.primaryColumns.map(
      (c) => c.propertyName,
    );
    if (primaryColumns.includes(field)) {
      throw new BadRequestException(`Cannot sort by primary key: ${field}`);
    }
    const columnNames = this.repository.metadata.columns.map(
      (c) => c.propertyName,
    );
    if (!columnNames.includes(field)) {
      throw new BadRequestException(`Unknown field: ${field}`);
    }
  }

  error(e) {
    if (e && typeof e === 'object' && 'message' in e && !('code' in e)) {
      throw new BadRequestException(e.message);
    }
    throwDbError(e);
  }
}