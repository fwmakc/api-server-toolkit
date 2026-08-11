import {
  Body,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  Post,
  Patch,
  SetMetadata,
  applyDecorators,
  UseGuards,
} from '@nestjs/common';
import { BaseEntity } from 'typeorm';
import { RelationsDto } from './dto/relations.dto';
import { Data, Doc } from './common.decorator';
import { CommonService } from './common.service';
import { CommonDto } from './common.dto';
import { ApiTags } from '@nestjs/swagger';
import { AccountInfo, } from './access.type';
import { accessGuard, Self } from './auth.decorator';
import { bind } from './service/bind.service';
import { isSuperuser } from './service/admin.service';
import { OWNER_TABLE } from './service/owner.service';
import { TENANT_TABLE, TENANT_FIELD } from './service/tenant.service';
import { getSoftDeleteColumn } from './service/soft-delete.service';
import { PermissionRegistry } from './permission.registry';
import {
  EntityControllerOptions,
  OperationAccess,
  normalizeAccess,
  normalizeRoles,
  getBindPath,
} from './access.type';
import { BindDto } from './dto/bind.dto';
import { SafeIdPipe } from './pipe/safe_id.pipe';
import { RolesGuard } from './guard/roles.guard';
import { ROLES_METADATA } from './guard/roles.guard';

function resolveBind(
  access: OperationAccess,
  account: AccountInfo,
  accountTable: string,
  accountField: string,
  tenantTable?: string,
  tenantField?: string,
  hasRoles?: boolean,
): BindDto | undefined {
  const level = normalizeAccess(access);
  if (level === 'closed') {
    if (hasRoles && account?.tenantId) {
      const tName = tenantTable || TENANT_TABLE;
      if (tName) {
        return {
          allow: isSuperuser(account),
          tenantName: tName,
          tenantKey: tenantField || TENANT_FIELD,
          tenantId: account.tenantId,
        };
      }
    }
    return undefined;
  }
  if (level === 'public') return undefined;
  if (level === 'superuser') return { allow: true };

  const allow = isSuperuser(account);
  const b: BindDto = { allow };

  if (level === 'owner') {
    const bindPath = getBindPath(access, accountTable || OWNER_TABLE);
    b.id = account?.['id'];
    b.key = accountField || 'id';
    b.name = bindPath;
  }

  if ((level === 'tenant' || level === 'owner') && !allow) {
    const tName = tenantTable || TENANT_TABLE;
    if (tName) {
      b.tenantName = tName;
      b.tenantKey = tenantField || TENANT_FIELD;
      b.tenantId = account?.tenantId;
    }
  }

  if (b.id !== undefined || b.tenantId !== undefined) {
    return b;
  }

  return undefined;
}

function route(
  access: OperationAccess,
  method: MethodDecorator,
  docName: string,
  dto?: any,
  roles?: string[],
): MethodDecorator {
  const level = normalizeAccess(access);
  const roleNames = roles?.length ? roles : undefined;

  if (level === 'closed' && !roleNames) return applyDecorators();

  const decs: any[] = [];

  if (level === 'closed' && roleNames) {
    decs.push(UseGuards(RolesGuard));
    decs.push(SetMetadata(ROLES_METADATA, roleNames));
  } else {
    decs.push(accessGuard(access));
    if (roleNames) {
      decs.push(UseGuards(RolesGuard));
      decs.push(SetMetadata(ROLES_METADATA, roleNames));
    }
  }

  decs.push(method);
  if (docName) decs.push(Doc(docName, dto));
  return applyDecorators(...decs);
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
  const accountTable = options.accountTable ?? '';
  const accountField = options.accountField ?? 'id';
  const tenantTable = options.tenantTable ?? '';
  const tenantField = options.tenantField ?? '';

  const readAccess = options.operations?.read ?? 'closed';
  const createAccess = options.operations?.create ?? 'closed';
  const updateAccess = options.operations?.update ?? 'closed';
  const deleteAccess = options.operations?.delete ?? 'closed';

  const readRoles = normalizeRoles(options.roles?.read);
  const createRoles = normalizeRoles(options.roles?.create);
  const updateRoles = normalizeRoles(options.roles?.update);
  const deleteRoles = normalizeRoles(options.roles?.delete);

  const allowedRelations = options.relations;

  PermissionRegistry.set(entity, {
    create: createAccess,
    read: readAccess,
    update: updateAccess,
    delete: deleteAccess,
    accountTable: accountTable || undefined,
    accountField: accountField || undefined,
    tenantTable: tenantTable || undefined,
    tenantField: tenantField || undefined,
  });

  const readRoute = route(readAccess, Get('find'), 'find', dto, readRoles);
  const readFirstRoute = route(readAccess, Get('find/first'), 'findFirst', dto, readRoles);
  const readManyRoute = route(
    readAccess,
    Get('find/many/:ids'),
    'findMany',
    dto,
    readRoles,
  );
  const readOneRoute = route(readAccess, Get('find/:id'), 'findOne', dto, readRoles);
  const countRoute = route(readAccess, Get('count'), 'count', dto, readRoles);
  const selfRoute = route(readAccess, Get('self'), 'self', dto, readRoles);
  const createRoute = route(createAccess, Post('create'), 'create', dto, createRoles);
  const updateRoute = route(updateAccess, Patch('update/:id'), 'update', dto, updateRoles);
  const removeRoute = route(deleteAccess, Delete('remove/:id'), 'remove', deleteRoles);
  const sortRoute = route(
    updateAccess,
    Post('position/sort'),
    'sortPosition',
    dto,
    updateRoles,
  );
  const moveRoute = route(
    updateAccess,
    Post('position/move/:id'),
    'movePosition',
    dto,
    updateRoles,
  );

  const softDeleteCol = getSoftDeleteColumn(entity);
  const hardDeleteRoute = softDeleteCol
    ? route(deleteAccess, Delete('hard-delete/:id'), 'hardDelete', undefined, deleteRoles)
    : applyDecorators();
  const restoreRoute = softDeleteCol
    ? route(deleteAccess, Patch('restore/:id'), 'restore', undefined, deleteRoles)
    : applyDecorators();

  const hasSelf = normalizeAccess(readAccess) === 'owner';
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
      const b = bind(account, {
        name: accountTable || OWNER_TABLE,
        key: accountField,
        allow: false,
        ...(tenantTable ? { tenantName: tenantTable } : {}),
        ...(tenantField ? { tenantKey: tenantField } : {}),
      });
      return await this.service.find({ where, select, order, relations: filterRelations(relations, allowedRelations) }, b);
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
      const b = resolveBind(readAccess, account, accountTable, accountField, tenantTable, tenantField, !!readRoles.length);
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
      const b = resolveBind(readAccess, account, accountTable, accountField, tenantTable, tenantField, !!readRoles.length);
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
      const b = resolveBind(readAccess, account, accountTable, accountField, tenantTable, tenantField, !!readRoles.length);
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
      const b = resolveBind(readAccess, account, accountTable, accountField, tenantTable, tenantField, !!readRoles.length);
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
      const b = resolveBind(readAccess, account, accountTable, accountField, tenantTable, tenantField, !!readRoles.length);
      return await this.service.count({ search, where, limit, offset, relations: filterRelations(relations, allowedRelations) }, b);
    }

    @createRoute
    async create(
      @Body('create') dto: Dto,
      @Body('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<Entity> {
      const b = resolveBind(createAccess, account, accountTable, accountField, tenantTable, tenantField, !!createRoles.length);
      return await this.service.create(dto, filterRelations(relations, allowedRelations), b);
    }

    @updateRoute
    async update(
      @Param('id', SafeIdPipe) id: string,
      @Body('update') dto: Dto,
      @Body('relations') relations: Array<RelationsDto>,
      @Self() account: AccountInfo,
    ): Promise<Entity> {
      const b = resolveBind(updateAccess, account, accountTable, accountField, tenantTable, tenantField, !!updateRoles.length);
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
      const b = resolveBind(deleteAccess, account, accountTable, accountField, tenantTable, tenantField, !!deleteRoles.length);
      return await this.service.remove(id, b);
    }

    @hardDeleteRoute
    async hardDelete(
      @Param('id', SafeIdPipe) id: string,
      @Self() account: AccountInfo,
    ): Promise<boolean> {
      const b = resolveBind(deleteAccess, account, accountTable, accountField, tenantTable, tenantField, !!deleteRoles.length);
      return await this.service.hardDelete(id, b);
    }

    @restoreRoute
    async restore(
      @Param('id', SafeIdPipe) id: string,
      @Self() account: AccountInfo,
    ): Promise<boolean> {
      const b = resolveBind(deleteAccess, account, accountTable, accountField, tenantTable, tenantField, !!deleteRoles.length);
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
      const b = resolveBind(updateAccess, account, accountTable, accountField, tenantTable, tenantField, !!updateRoles.length);
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
      const b = resolveBind(updateAccess, account, accountTable, accountField, tenantTable, tenantField, !!updateRoles.length);
      const result = await this.service.movePosition(id, field, position, b);
      if (!result) {
        throw new NotFoundException('Entrie position has not been moved');
      }
      return result;
    }
  }

  return BaseEntityController;
};