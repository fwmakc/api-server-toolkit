import { PermissionRegistry } from '../permission.registry';

function isOwnedBy(
  entity: any,
  accountTable: string,
  callerId: number | string,
  accountField: string,
): boolean {
  const segments = accountTable.split('.');
  let current = entity;
  for (const segment of segments) {
    current = current?.[segment];
    if (!current) return false;
  }
  return String(current?.[accountField]) === String(callerId);
}

export function filterNestedRelations(
  result: any[],
  bind: any,
): void {
  if (!result || !Array.isArray(result)) return;
  if (!bind || bind.id === undefined || bind.allow) return;

  const seen = new WeakSet();
  const callerId = bind.id;
  const accountField = bind.key || 'id';

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
          const config = PermissionRegistry.get(firstEntity.constructor);
          if (config?.accountTable) {
            filtered = value.filter((nested: any) =>
              isOwnedBy(
                nested,
                config.accountTable,
                callerId,
                accountField,
              ),
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
        const config = PermissionRegistry.get(value.constructor);
        if (config?.accountTable) {
          if (
            !isOwnedBy(value, config.accountTable, callerId, accountField)
          ) {
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
