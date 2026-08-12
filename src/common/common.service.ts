import { BadRequestException } from '@nestjs/common';
import { throwDbError } from './service/error.service';
import { getSoftDeleteColumn } from './service/soft-delete.service';
import {
  BaseEntity,
  DeepPartial,
  EntityManager,
  In,
  Repository,
} from 'typeorm';
import { getTenantStrategy } from './service/tenant-strategy';
import { TenantContext } from './service/tenant-context';
import { RelationsDto } from './dto/relations.dto';
import { CommonDto } from './common.dto';
import { FindDto } from './dto/find.dto';
import { FindManyDto } from './dto/find_many.dto';
import { FindOneDto } from './dto/find_one.dto';
import {
  removePrivateFields,
  stripWriteFields,
} from './service/private_fields.service';
import { bind } from './service/bind.service';
import { BindDto } from './dto/bind.dto';
import { buildFindWhere, buildCountWhere, executeFind } from './service/find.helper';
import { resolveAutoAssign, resolveBindRelationId } from './service/bind-resolve.helper';
import { prepareAndCreate, prepareAndUpdate } from './service/write.helper';
import { softRemove, hardRemove, restoreDeleted } from './service/delete.helper';
import { validatePositionField, executeSortPosition, executeMovePosition } from './service/position.helper';
import { getUniqueColumns, findUniqueEntry } from './service/unique.helper';

// keep backward compat alias
const findUniqueEntrie = findUniqueEntry;

export class CommonService<Dto extends CommonDto, Entity extends BaseEntity> {
  protected readonly repository: Repository<Entity>;

  protected getRepository(): Repository<Entity> {
    const strategy = getTenantStrategy();
    if (strategy === 'schema') {
      const qr = TenantContext.getQueryRunner();
      if (qr) return qr.manager.getRepository(this.repository.target);
    }
    if (strategy === 'database') {
      const ds = TenantContext.getDataSource();
      if (ds) return ds.getRepository(this.repository.target);
    }
    return this.repository;
  }

  async find(
    find: FindDto = {},
    bind: BindDto = { allow: true },
  ): Promise<Entity[]> {
    const softDeleteCol = getSoftDeleteColumn(this.repository.metadata.target);
    const findResult = buildFindWhere(bind, find, softDeleteCol);
    try {
      return await executeFind(this.getRepository(), find, findResult, bind);
    } catch (e) {
      this.error(e);
    }
  }

  async findFirst(
    find: FindDto,
    bind: BindDto = { allow: true },
  ): Promise<Entity> {
    const [result] = await this.find({ ...find, limit: 1 }, bind);
    return result;
  }

  async findMany(
    findMany: FindManyDto,
    bind: BindDto = { allow: true },
  ): Promise<Entity[]> {
    const { ids, ...find } = findMany;
    const where: any = { id: In(ids?.map((i) => Number(i) || 0)) };
    return await this.find({ ...find, where, order: { id: 'ASC' }, limit: 0, offset: 0 }, bind);
  }

  async findOne(
    findOne: FindOneDto,
    bind: BindDto = { allow: true },
  ): Promise<Entity> {
    const { id, ...find } = findOne;
    const where: any = { ...find.where, id };
    const [result] = await this.find({ ...find, where, limit: 1, offset: 0 }, bind);
    return result;
  }

  async count(find: FindDto, bind: BindDto = { allow: true }): Promise<number> {
    const softDeleteCol = getSoftDeleteColumn(this.repository.metadata.target);
    const { where, relationNames } = buildCountWhere(bind, find, softDeleteCol);
    return await this.getRepository().count({
      where,
      ...(relationNames.length > 0 ? { relations: relationNames } : {}),
    });
  }

  async countDistinct(field: string, find: FindDto): Promise<number> {
    if (!field || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new BadRequestException(`Invalid field name: ${field}`);
    }
    const columnNames = this.repository.metadata.columns.map((c) => c.propertyName);
    if (!columnNames.includes(field)) {
      throw new BadRequestException(`Unknown field: ${field}`);
    }
    const qb = this.getRepository().createQueryBuilder('t');
    const where = (find as any).where;
    if (where) qb.where(where);
    const result = await qb.select(`COUNT(DISTINCT t.${field})`, 'count').getRawOne();
    return Number(result?.count || 0);
  }

  async create(
    dto: Dto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
    externalManager?: EntityManager,
  ): Promise<Entity> {
    delete dto.id;
    const entity: DeepPartial<any> = { ...dto };
    stripWriteFields(entity, this.repository.metadata.target, bind, bind);

    try {
      let savedId: number | string | undefined;
      const doCreate = async (manager: EntityManager) => {
        const saved = await prepareAndCreate(entity, this.repository.target, bind, manager);
        savedId = saved?.id;
      };
      if (externalManager) {
        await doCreate(externalManager);
      } else {
        await this.getRepository().manager.transaction(doCreate);
      }
      return await this.findOne({ id: savedId, relations }, bind);
    } catch (e) {
      this.error(e);
    }
  }

  async createEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any> {
    const repo = manager ? manager.getRepository(this.repository.target) : this.getRepository();
    return await repo.save(entity);
  }

  async update(
    id: number | string,
    dto: Dto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
    externalManager?: EntityManager,
  ): Promise<Entity> {
    if (id === undefined) return;
    const exists = await this.findOne({ id, select: { id: true } }, bind);
    if (!exists) return;

    const entity: DeepPartial<any> = { ...dto, id };
    stripWriteFields(entity, this.repository.metadata.target, bind, bind);

    try {
      const doUpdate = async (manager: EntityManager) => {
        await prepareAndUpdate(entity, this.repository.target, bind, manager);
      };
      if (externalManager) {
        await doUpdate(externalManager);
      } else {
        await this.getRepository().manager.transaction(doUpdate);
      }
      return await this.findOne({ id, relations }, bind);
    } catch (e) {
      this.error(e);
    }
  }

  async updateEntity(entity: DeepPartial<any>, manager?: EntityManager): Promise<any> {
    const idType = this.getIdType();
    entity.id = idType === 'bigint' ? `${entity.id}` : +entity.id;
    const repo = manager ? manager.getRepository(this.repository.target) : this.getRepository();
    return await repo.save(entity);
  }

  getIdType(): string {
    const column: DeepPartial<any> = this.repository.metadata.columns.find(
      (column) => column.propertyName === 'id',
    );
    return column?.type || 'int';
  }

  async remove(id: number | string, bind: BindDto = { allow: true }, externalManager?: EntityManager): Promise<boolean> {
    if (bind.id !== undefined && !bind.allow) {
      const find = await this.findOne({ id, select: { id: true } }, bind);
      if (!find) return false;
    }
    try {
      const repo = externalManager ? externalManager.getRepository(this.repository.target) : this.getRepository();
      const softDeleteCol = getSoftDeleteColumn(this.repository.metadata.target);
      if (softDeleteCol) {
        return await softRemove(repo, id, softDeleteCol);
      }
      return await hardRemove(repo, id);
    } catch (e) {
      this.error(e);
    }
  }

  async hardDelete(id: number | string, bind: BindDto = { allow: true }, externalManager?: EntityManager): Promise<boolean> {
    if (bind.id !== undefined && !bind.allow) {
      const find = await this.findOne({ id, select: { id: true } }, bind);
      if (!find) return false;
    }
    try {
      const repo = externalManager ? externalManager.getRepository(this.repository.target) : this.getRepository();
      return await hardRemove(repo, id);
    } catch (e) {
      this.error(e);
    }
  }

  async restore(id: number | string, bind: BindDto = { allow: true }): Promise<boolean> {
    const col = getSoftDeleteColumn(this.repository.metadata.target);
    if (!col) return false;
    if (bind.id !== undefined && !bind.allow) {
      const find = await this.findOne({ id, select: { id: true } }, bind);
      if (!find) return false;
    }
    try {
      return await restoreDeleted(this.getRepository(), id, col);
    } catch (e) {
      this.error(e);
    }
  }

  async upsert(
    dto: Dto,
    relations: Array<RelationsDto> = undefined,
    bind: BindDto = { allow: true },
  ): Promise<Entity> {
    delete dto.id;
    const entity: DeepPartial<any> = { ...dto };

    if (bind.id !== undefined && !bind.allow) {
      const autoAssign = await resolveAutoAssign(
        this.repository.metadata,
        bind,
        this.getRepository().manager,
      );
      if (autoAssign) {
        entity[autoAssign.name] = { id: autoAssign.id };
      }
    }

    const existsEntrie = await this.findUniqueEntry(entity);
    if (existsEntrie?.id) {
      return await this.update(existsEntrie.id, dto, relations, bind);
    }

    try {
      return await this.create(dto, relations, bind);
    } catch (e) {
      if (e?.code === '23505') {
        const retryEntrie = await this.findUniqueEntry(entity);
        if (retryEntrie?.id) {
          return await this.update(retryEntrie.id, dto, relations, bind);
        }
      }
      this.error(e);
    }
  }

  async sortPosition(
    field: string,
    find: FindDto,
    bind: BindDto = { allow: true },
  ): Promise<boolean> {
    validatePositionField(this.repository.metadata, field);

    if (!find.order) {
      find.order = { [field]: 'asc', id: 'asc' } as any;
    }

    const entries = await this.find(
      { ...find, select: { id: true, [field]: true } as any, relations: undefined },
      bind,
    );
    if (!entries) return;

    if (typeof entries?.[0]?.[field] !== 'number') {
      this.error({ message: 'cannot position by non-numeric field' });
    }

    try {
      await this.getRepository().manager.transaction(async (manager) => {
        await executeSortPosition(
          this.repository.target,
          field,
          entries,
          find,
          bind,
          this.repository.metadata,
          manager,
        );
      });
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
    validatePositionField(this.repository.metadata, field);
    if (position === undefined || position === null) return false;

    const [entrie, lastEntrie] = await Promise.all([
      this.findOne({ id, select: { [field]: true } }, bind),
      this.findFirst({ select: { id: true, [field]: true }, order: { [field]: 'DESC' } }, bind),
    ]);
    if (!entrie) return false;

    if (typeof entrie[field] !== 'number') {
      this.error({ message: 'cannot position by non-numeric field' });
    }

    const lastPosition = +(lastEntrie as any)?.[field] || 0;
    if (position < 0 || position > lastPosition + 1) {
      if (String(id) === String((lastEntrie as any)?.id)) return false;
      position = lastPosition + 1;
    }

    try {
      const oldPosition = +entrie[field] || 0;
      const newPosition = +position || 0;
      if (oldPosition === newPosition) return false;

      await this.getRepository().manager.transaction(async (manager) => {
        await executeMovePosition(
          this.repository.target,
          id,
          field,
          position,
          oldPosition,
          newPosition,
          manager,
        );
      });
      return true;
    } catch (e) {
      this.error(e);
    }
  }

  getUniqueColumns(): Array<string[]> {
    return getUniqueColumns(this.repository.metadata);
  }

  async findUniqueEntry(entity: DeepPartial<any>): Promise<any> {
    return findUniqueEntry(this.getRepository(), entity);
  }

  async findUniqueEntrie(entity: DeepPartial<any>): Promise<any> {
    return this.findUniqueEntry(entity);
  }

  bind(entrie, data) {
    return bind(entrie, data);
  }

  error(e) {
    if (e && typeof e === 'object' && 'message' in e && !('code' in e)) {
      throw new BadRequestException(e.message);
    }
    throwDbError(e);
  }
}
