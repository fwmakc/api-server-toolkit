import { EntityManager, EntityMetadata } from 'typeorm';
import { PermissionRegistry } from '../permission.registry';
import {
  AccessRule,
  normalizeRuleNames,
  parseAccessPath,
  PUBLIC_ROLE,
} from '../access.rules';
import { BindDto } from '../dto/bind.dto';

interface RelationInfo {
  propertyName: string;
  inverseMetadata: EntityMetadata;
  target: any;
}

const relationCache = new WeakMap<object, RelationInfo[]>();

function getCachedRelations(metadata: EntityMetadata): RelationInfo[] {
  const target = metadata.target as object;
  let cached = relationCache.get(target);
  if (cached) return cached;

  cached = metadata.relations.map((relation) => ({
    propertyName: relation.propertyName,
    inverseMetadata: relation.inverseEntityMetadata,
    target: relation.inverseEntityMetadata.target,
  }));

  relationCache.set(target, cached);
  return cached;
}

/** Разрешено ли создавать вложенную сущность: create-правила её контроллера. */
function canCreate(rules: AccessRule[] | undefined, bind: BindDto | undefined): boolean {
  if (!rules?.length) return false;
  if (bind?.allow === true) return true;
  const roles = bind?.roles || [PUBLIC_ROLE];
  return rules.some((rule) =>
    normalizeRuleNames(rule.who).some((r) => roles.includes(r)),
  );
}

export async function sanitizeForSave(
  entity: any,
  metadata: EntityMetadata,
  bind: BindDto | undefined,
  manager: EntityManager,
): Promise<void> {
  const seen = new WeakSet();
  await sanitizeEntity(entity, metadata, bind, seen, manager);
}

async function sanitizeEntity(
  entity: any,
  metadata: EntityMetadata,
  bind: BindDto | undefined,
  seen: WeakSet<object>,
  manager: EntityManager,
): Promise<void> {
  if (!entity || typeof entity !== 'object' || seen.has(entity)) return;
  seen.add(entity);

  const relations = getCachedRelations(metadata);

  for (const info of relations) {
    const key = info.propertyName;
    const value = entity[key];
    if (value === undefined || value === null) continue;

    const relatedMeta = info.inverseMetadata;
    const relatedTarget = info.target;
    const config = PermissionRegistry.get(relatedTarget);

    const isAutoAssignRelation = bind?.name?.split('.')[0] === key;

    if (Array.isArray(value)) {
      const ids: (number | string)[] = [];

      for (const item of value) {
        if (item && typeof item === 'object' && item.id !== undefined && item.id !== null) {
          ids.push(item.id);
        }
      }

      const ownedSet = isAutoAssignRelation
        ? new Set(ids)
        : await checkOwnership(relatedTarget, ids, bind, manager);

      const slots: any[] = [];

      for (const item of value) {
        if (
          item &&
          typeof item === 'object' &&
          item.id !== undefined &&
          item.id !== null
        ) {
          if (ownedSet.has(item.id)) {
            slots.push({ id: item.id });
          }
        } else if (item && typeof item === 'object') {
          slots.push(
            sanitizeRelationItem(item, relatedMeta, config, bind, seen, manager),
          );
        } else {
          if (item !== null && item !== undefined) {
            slots.push(item);
          }
        }
      }

      const resolved = await Promise.all(slots);
      const sanitized = resolved.filter((r) => r !== null);
      entity[key] = sanitized;
    } else if (typeof value === 'object' && value.constructor !== Date) {
      if (value.id !== undefined && value.id !== null) {
        const ownedSet = isAutoAssignRelation
          ? new Set([value.id])
          : await checkOwnership(relatedTarget, [value.id], bind, manager);
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
  config: { operations?: { create?: AccessRule[] } } | undefined,
  bind: BindDto | undefined,
  seen: WeakSet<object>,
  manager: EntityManager,
): Promise<unknown | null> {
  if (!item || typeof item !== 'object') return item;

  if (config) {
    if (canCreate(config.operations?.create, bind)) {
      await sanitizeEntity(item, metadata, bind, seen, manager);
      return item;
    }
  }

  return null;
}

/**
 * Проверяет, что прицепляемые id связанной сущности принадлежат вызывающему:
 * берём owner-путь из read-правил связанной сущности и джойним его к фильтру по bind.id.
 * Нет owner-пути у связанной сущности — считаем все id доступными (как раньше без accountTable).
 */
async function checkOwnership(
  relatedTarget: any,
  ids: (number | string)[],
  bind: BindDto | undefined,
  manager: EntityManager,
): Promise<Set<unknown>> {
  if (ids.length === 0) return new Set();

  if (bind?.allow === true) {
    return new Set(ids);
  }

  const config = PermissionRegistry.get(relatedTarget);
  if (!config) {
    // Связанная сущность без конфига доступа — прицеплять нельзя (secure by default).
    return new Set();
  }

  const ownerPath = PermissionRegistry.getOwnerPath(relatedTarget);
  if (!ownerPath) {
    return new Set(ids);
  }

  const { name, key } = parseAccessPath(ownerPath);
  const segments = name ? name.split('.') : [];

  const repo = manager.getRepository(relatedTarget);
  const qb = repo
    .createQueryBuilder('e')
    .setLock('pessimistic_write')
    .where('e.id IN (:...ids)', { ids })
    .select(['e.id']);

  let alias = 'e';
  for (let i = 0; i < segments.length; i++) {
    const nextAlias = `rel${i}`;
    qb.leftJoin(`${alias}.${segments[i]}`, nextAlias);
    alias = nextAlias;
  }

  qb.andWhere(
    segments.length ? `${alias}.${key} = :accountId` : `e.${key} = :accountId`,
    { accountId: bind?.id },
  );

  const owned = await qb.getMany();
  return new Set(owned.map((r: any) => r.id));
}
