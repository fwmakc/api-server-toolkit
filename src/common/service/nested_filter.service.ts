import { PermissionRegistry } from '../permission.registry';
import { BindDto } from '../dto/bind.dto';
import { parseAccessPath } from '../access.rules';

function isOwnedBy(
  entity: any,
  ownerPath: string,
  callerId: number | string,
  key: string,
): boolean {
  if (!ownerPath) {
    return String(entity?.[key]) === String(callerId);
  }
  let current = entity;
  for (const segment of ownerPath.split('.')) {
    current = current?.[segment];
    if (!current) return false;
  }
  return String(current?.[key]) === String(callerId);
}

/**
 * Фильтрует вложенные отношения по владельцу, когда основная выборка
 * ограничена owner-скопом (multi-hop). Путь берётся из read-правил
 * вложенной сущности (первый scope.owner в PermissionRegistry).
 */
export function filterNestedRelations(
  result: any[],
  bind: BindDto | undefined,
): void {
  if (!result || !Array.isArray(result)) return;
  if (!bind || bind.id === undefined || bind.allow) return;

  const seen = new WeakSet();
  const callerId = bind.id;

  const walkObject = (obj: any) => {
    if (!obj || typeof obj !== 'object' || seen.has(obj)) return;
    seen.add(obj);

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (Array.isArray(value)) {
        let filtered = value;
        const firstEntity = value.find(
          (v: any) => v && typeof v === 'object' && v.constructor,
        );
        if (firstEntity?.constructor) {
          const ownerPath = PermissionRegistry.getOwnerPath(firstEntity.constructor);
          if (ownerPath !== undefined) {
            const { name: ownerName, key: ownerKey } = parseAccessPath(ownerPath);
            filtered = value.filter((nested: any) =>
              isOwnedBy(nested, ownerName, callerId, ownerKey),
            );
            obj[key] = filtered;
          }
        }
        filtered.forEach((item: any) => walkObject(item));
      } else if (
        value &&
        typeof value === 'object' &&
        value.constructor &&
        value.constructor !== Object &&
        value.constructor !== Date
      ) {
        const ownerPath = PermissionRegistry.getOwnerPath(value.constructor);
        if (ownerPath !== undefined) {
          const { name: ownerName, key: ownerKey } = parseAccessPath(ownerPath);
          if (!isOwnedBy(value, ownerName, callerId, ownerKey)) {
            delete obj[key];
            continue;
          }
        }
        walkObject(value);
      }
    }
  };

  result.forEach((item) => walkObject(item));
}
