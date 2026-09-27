import {
  Body,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  Post,
  Patch,
  Type,
  applyDecorators,
} from '@nestjs/common';
import { BaseEntity } from 'typeorm';
import { RelationsDto } from './dto/relations.dto';
import { Data, Doc } from './common.decorator';
import { CommonService } from './common.service';
import { CommonDto } from './common.dto';
import { ApiTags } from '@nestjs/swagger';
import { AccountInfo } from './access.type';
import { Self } from './auth.decorator';
import { SafeIdPipe } from './pipe/safe_id.pipe';
import { getSoftDeleteColumn } from './service/soft-delete.service';
import { PermissionRegistry } from './permission.registry';
import {
  AccessRule,
  EntityAccessConfig,
  FieldRule,
  OperationName,
  accessBind,
} from './access.rules';
import { accessDecorators } from './decorator/access.decorator';

export interface EntityControllerOptions {
  name: string;
  dto: Type<CommonDto>;
  entity: Type<unknown>;
  /** Вайтлист связей, доступных для загрузки через relations. */
  relations?: string[];
  /** Правила доступа по операциям. Операция не задана — маршрутов нет (default deny). */
  operations?: Partial<Record<OperationName, AccessRule[]>>;
  /** Правила на поля и связи (read/write). Не совпало — поле вырезается. */
  fields?: Record<string, FieldRule>;
}

function route(
  rules: AccessRule[] | undefined,
  method: MethodDecorator,
  docName: string,
  dto?: Type<CommonDto>,
): MethodDecorator {
  if (!rules?.length) return applyDecorators();
  return applyDecorators(
    ...accessDecorators(rules),
    method,
    ...(docName ? [Doc(docName, dto)] : []),
  );
}

function filterRelations(
  relations: Array<RelationsDto> | undefined,
  whitelist: string[] | undefined,
): Array<RelationsDto> | undefined {
  if (!relations || !Array.isArray(relations)) return relations;
  if (!whitelist || whitelist.length === 0) return undefined;
  return relations.filter((r) => r.name && whitelist.includes(r.name));
}

export const EntityController = (options: EntityControllerOptions) => {
  const { name, dto, entity } = options;

  const readRules = options.operations?.read;
  const createRules = options.operations?.create;
  const updateRules = options.operations?.update;
  const deleteRules = options.operations?.delete;

  const allowedRelations = options.relations;

  const config: EntityAccessConfig = {
    operations: options.operations,
    fields: options.fields,
  };
  PermissionRegistry.set(entity, config);

  const readRoute = route(readRules, Get('find'), 'find', dto);
  const readFirstRoute = route(readRules, Get('find/first'), 'findFirst', dto);
  const readManyRoute = route(readRules, Get('find/many/:ids'), 'findMany', dto);
  const readOneRoute = route(readRules, Get('find/:id'), 'findOne', dto);
  const countRoute = route(readRules, Get('count'), 'count', dto);
  const selfRoute = route(readRules, Get('self'), 'self', dto);
  const createRoute = route(createRules, Post('create'), 'create', dto);
  const updateRoute = route(updateRules, Patch('update/:id'), 'update', dto);
  const removeRoute = route(deleteRules, Delete('remove/:id'), 'remove');
  const sortRoute = route(updateRules, Post('position/sort'), 'sortPosition', dto);
  const moveRoute = route(updateRules, Post('position/move/:id'), 'movePosition', dto);

  const softDeleteCol = getSoftDeleteColumn(entity);
  const hardDeleteRoute = softDeleteCol
    ? route(deleteRules, Delete('hard-delete/:id'), 'hardDelete')
    : applyDecorators();
  const restoreRoute = softDeleteCol
    ? route(deleteRules, Patch('restore/:id'), 'restore')
    : applyDecorators();

  const hasSelf = (readRules || []).some(
    (r) => r.scope && typeof r.scope === 'object' && 'owner' in r.scope,
  );
  const selfDecorator = hasSelf ? selfRoute : applyDecorators();

  @ApiTags(name)
  class BaseEntityController<
    Dto extends CommonDto,
    Entity extends BaseEntity,
    Service extends CommonService<Dto, Entity>,
  > {
    readonly service: Service;

    @selfDecorator
    async self(
      @Data('select') select: object,
      @Data('where') where: object,
      @Data('order') order: object,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<Entity[]> {
      const b = accessBind(readRules, account);
      return await this.service.find(
        { where, select, order, relations: filterRelations(relations, allowedRelations) },
        b,
      );
    }

    @readRoute
    async find(
      @Data('search') search: object,
      @Data('select') select: object,
      @Data('where') where: object,
      @Data('order') order: object,
      @Data('limit') limit: number = undefined,
      @Data('offset') offset: number = undefined,
      @Data('relations') relations: Array<RelationsDto>,
      @Data('join') join: boolean = false,
      @Self() account: AccountInfo,
    ): Promise<Entity[]> {
      const b = accessBind(readRules, account);
      return await this.service.find(
        { search, select, where, order, limit, offset, relations: filterRelations(relations, allowedRelations), join },
        b,
      );
    }

    @readFirstRoute
    async findFirst(
      @Data('search') search: object,
      @Data('select') select: object,
      @Data('where') where: object,
      @Data('order') order: object,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<Entity> {
      const b = accessBind(readRules, account);
      return await this.service.findFirst(
        { search, select, where, order, relations: filterRelations(relations, allowedRelations) },
        b,
      );
    }

    @readManyRoute
    async findMany(
      @Param('ids', new ParseArrayPipe({ items: String, separator: ',' }))
      ids: Array<string>,
      @Data('select') select: object,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<Entity[]> {
      const b = accessBind(readRules, account);
      const result = await this.service.findMany({ ids, select, relations: filterRelations(relations, allowedRelations) }, b);
      if (!result) {
        throw new NotFoundException('Entrie not found');
      }
      return result;
    }

    @readOneRoute
    async findOne(
      @Param('id', SafeIdPipe) id: string,
      @Data('select') select: object,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<Entity> {
      const b = accessBind(readRules, account);
      const result = await this.service.findOne(
        { id, select, relations: filterRelations(relations, allowedRelations) },
        b,
      );
      if (!result) {
        throw new NotFoundException('Entrie not found');
      }
      return result;
    }

    @countRoute
    async count(
      @Data('search') search: object,
      @Data('where') where: object,
      @Data('limit') limit: number = undefined,
      @Data('offset') offset: number = undefined,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<number> {
      const b = accessBind(readRules, account);
      return await this.service.count({ search, where, limit, offset, relations: filterRelations(relations, allowedRelations) }, b);
    }

    @createRoute
    async create(
      @Body('create') dto: Dto,
      @Body('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<Entity> {
      const b = accessBind(createRules, account);
      return await this.service.create(dto, filterRelations(relations, allowedRelations), b);
    }

    @updateRoute
    async update(
      @Param('id', SafeIdPipe) id: string,
      @Body('update') dto: Dto,
      @Body('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<Entity> {
      const b = accessBind(updateRules, account);
      const result = await this.service.update(id, dto, filterRelations(relations, allowedRelations), b);
      if (!result) {
        throw new NotFoundException('Entrie not found');
      }
      return result;
    }

    @removeRoute
    async remove(
      @Param('id', SafeIdPipe) id: string,
      @Self() account: AccountInfo,
    ): Promise<boolean> {
      const b = accessBind(deleteRules, account);
      return await this.service.remove(id, b);
    }

    @hardDeleteRoute
    async hardDelete(
      @Param('id', SafeIdPipe) id: string,
      @Self() account: AccountInfo,
    ): Promise<boolean> {
      const b = accessBind(deleteRules, account);
      return await this.service.hardDelete(id, b);
    }

    @restoreRoute
    async restore(
      @Param('id', SafeIdPipe) id: string,
      @Self() account: AccountInfo,
    ): Promise<boolean> {
      const b = accessBind(deleteRules, account);
      return await this.service.restore(id, b);
    }

    @sortRoute
    async sortPosition(
      @Data('field') field: string,
      @Data('select') select: object,
      @Data('where') where: object,
      @Data('order') order: object,
      @Data('limit') limit: number = undefined,
      @Data('offset') offset: number = undefined,
      @Data('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<boolean> {
      const b = accessBind(updateRules, account);
      const result = await this.service.sortPosition(
        field,
        { select, where, order, limit, offset, relations: filterRelations(relations, allowedRelations) },
        b,
      );
      if (!result) {
        throw new NotFoundException('Entries not found');
      }
      return result;
    }

    @moveRoute
    async movePosition(
      @Param('id', SafeIdPipe) id: string,
      @Data('field') field: string,
      @Data('position') position: number = undefined,
      @Self() account: AccountInfo,
    ): Promise<boolean> {
      const b = accessBind(updateRules, account);
      const result = await this.service.movePosition(id, field, position, b);
      if (!result) {
        throw new NotFoundException('Entrie position has not been moved');
      }
      return result;
    }
  }

  return BaseEntityController;
};
