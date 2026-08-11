import { BadRequestException } from '@nestjs/common';
import { And, DeepPartial, EntityManager, EntityMetadata, EntityTarget, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual } from 'typeorm';
import { parseWhereObject } from './where.service';
import { BindDto } from '../dto/bind.dto';
import { OWNER_TABLE } from './owner.service';
import { FindDto } from '../dto/find.dto';

export function validatePositionField(metadata: EntityMetadata, field: string): void {
  if (!field || typeof field !== 'string') {
    throw new BadRequestException('Field name is required');
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
    throw new BadRequestException(`Invalid field name: ${field}`);
  }
  const primaryColumns = metadata.primaryColumns.map((c) => c.propertyName);
  if (primaryColumns.includes(field)) {
    throw new BadRequestException(`Cannot sort by primary key: ${field}`);
  }
  const columnNames = metadata.columns.map((c) => c.propertyName);
  if (!columnNames.includes(field)) {
    throw new BadRequestException(`Unknown field: ${field}`);
  }
}

export async function executeSortPosition<Entity>(
  entityTarget: EntityTarget<Entity>,
  field: string,
  entries: any[],
  find: FindDto,
  bind: BindDto,
  metadata: EntityMetadata,
  manager: EntityManager,
): Promise<boolean> {
  let resetWhere: Record<string, unknown> = {};
  if (find.where) {
    resetWhere = parseWhereObject(find.where);
  }
  if (bind.id !== undefined) {
    const { resolveBindRelationId } = await import('./bind-resolve.helper');
    const resolvedId = await resolveBindRelationId(metadata, bind, manager);
    resetWhere = {
      ...resetWhere,
      [bind.name || OWNER_TABLE]:
        resolvedId !== null
          ? { id: resolvedId }
          : { [bind.key || 'id']: bind.id },
    };
  }
  if (bind.tenantId !== undefined && bind.tenantName && !bind.allow) {
    resetWhere = {
      ...resetWhere,
      [bind.tenantName]: {
        [bind.tenantKey || 'id']: bind.tenantId,
      },
    };
  }
  if (Object.keys(resetWhere).length > 0) {
    await manager.update(entityTarget, resetWhere, {
      [field]: 0,
    } as DeepPartial<any>);
  } else if (find.limit || find.offset) {
    throw new BadRequestException(
      'sortPosition with limit/offset requires a where filter or bind to scope the reset',
    );
  }

  entries.forEach((entrie: any, index: number) => {
    entrie[field] = index + 1;
  });

  await manager.save(entityTarget, entries);
  return true;
}

export async function executeMovePosition<Entity>(
  entityTarget: EntityTarget<Entity>,
  id: number | string,
  field: string,
  position: number,
  oldPosition: number,
  newPosition: number,
  manager: EntityManager,
): Promise<void> {
  if (oldPosition === newPosition) return;

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

  await manager.update(entityTarget, whereEntries, updateEntries);

  const updateCurrentEntrie: DeepPartial<any> = {
    [field]: newPosition,
  };
  await manager.update(entityTarget, id, updateCurrentEntrie);
}
