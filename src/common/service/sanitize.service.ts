import { EntityManager, EntityMetadata, In } from 'typeorm';
import { PermissionRegistry } from '../permission.registry';
import {
  AccessLevel,
  OperationConfig,
  normalizeAccess,
} from '../access.type';

function canCreate(level: AccessLevel, bind: any): boolean {
  if (!bind) return level === 'public';
  switch (level) {
    case 'public':
      return true;
    case 'account':
      return bind?.id !== undefined || bind?.allow === true;
    case 'owner':
      return true;
    case 'admin':
      return !!bind?.allow;
    case 'closed':
      return false;
    default:
      return true;
  }
}

export async function sanitizeForSave(
  entity: any,
  metadata: EntityMetadata,
  bind: any,
  manager: EntityManager,
): Promise<void> {
  const seen = new WeakSet();
  await sanitizeEntity(entity, metadata, bind, seen, manager);
}

async function sanitizeEntity(
  entity: any,
  metadata: EntityMetadata,
  bind: any,
  seen: WeakSet<object>,
  manager: EntityManager,
): Promise<void> {
  if (!entity || typeof entity !== 'object' || seen.has(entity)) return;
  seen.add(entity);

  for (const relation of metadata.relations) {
    const key = relation.propertyName;
    const value = entity[key];
    if (value === undefined || value === null) continue;

    const relatedMeta = relation.inverseEntityMetadata;
    const relatedTarget = relatedMeta.target;
    const config = PermissionRegistry.get(relatedTarget);

    const isAutoAssignRelation = bind?.name?.split('.')[0] === key;

    if (Array.isArray(value)) {
      const ids: any[] = [];
      const noIdItems: any[] = [];

      for (const item of value) {
        if (item && typeof item === 'object' && item.id !== undefined && item.id !== null) {
          ids.push(item.id);
        } else if (item && typeof item === 'object') {
          noIdItems.push(item);
        }
      }

      const ownedSet = isAutoAssignRelation
        ? new Set(ids)
        : await checkOwnership(
            relatedTarget,
            ids,
            config,
            bind,
            manager,
          );

      const sanitized: any[] = [];
      for (const item of value) {
        if (
          item &&
          typeof item === 'object' &&
          item.id !== undefined &&
          item.id !== null
        ) {
          if (ownedSet.has(item.id)) {
            sanitized.push({ id: item.id });
          }
        } else if (item && typeof item === 'object') {
          const result = await sanitizeRelationItem(
            item,
            relatedMeta,
            config,
            bind,
            seen,
            manager,
          );
          if (result !== null) sanitized.push(result);
        } else {
          if (item !== null && item !== undefined) {
            sanitized.push(item);
          }
        }
      }
      entity[key] = sanitized;
    } else if (typeof value === 'object' && value.constructor !== Date) {
      if (value.id !== undefined && value.id !== null) {
        const ownedSet = isAutoAssignRelation
          ? new Set([value.id])
          : await checkOwnership(
              relatedTarget,
              [value.id],
              config,
              bind,
              manager,
            );
        if (ownedSet.has(value.id)) {
          entity[key] = { id: value.id };
        } else {
          delete entity[key];
        }
      } else {
        const result = await sanitizeRelationItem(
          value,
          relatedMeta,
          config,
          bind,
          seen,
          manager,
        );
        if (result === null) {
          delete entity[key];
        } else {
          entity[key] = result;
        }
      }
    }
  }
}

async function sanitizeRelationItem(
  item: any,
  metadata: EntityMetadata,
  config: OperationConfig | undefined,
  bind: any,
  seen: WeakSet<object>,
  manager: EntityManager,
): Promise<any | null> {
  if (!item || typeof item !== 'object') return item;

  if (config) {
    const createLevel = normalizeAccess(config.create, 'closed');
    if (canCreate(createLevel, bind)) {
      await sanitizeEntity(item, metadata, bind, seen, manager);
      return item;
    }
  }

  return null;
}

async function checkOwnership(
  relatedTarget: any,
  ids: any[],
  config: OperationConfig | undefined,
  bind: any,
  manager: EntityManager,
): Promise<Set<any>> {
  if (ids.length === 0) return new Set();

  if (bind?.allow === true) {
    return new Set(ids);
  }

  if (!config) {
    return new Set();
  }

  const accountRelation = PermissionRegistry.getAccountTable(relatedTarget);
  if (!accountRelation) {
    return new Set(ids);
  }

  const accountField = PermissionRegistry.getAccountField(relatedTarget) || 'id';
  const segments = accountRelation.split('.');
  let accountWhere: any = { [accountField]: bind?.id };
  for (let i = segments.length - 1; i >= 0; i--) {
    accountWhere = { [segments[i]]: accountWhere };
  }

  const relatedRepo = manager.getRepository(relatedTarget);
  const owned = await relatedRepo.find({
    where: { id: In(ids), ...accountWhere } as any,
    select: { id: true } as any,
  });

  return new Set(owned.map((r: any) => r.id));
}
