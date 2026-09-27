import { EntityAccessConfig } from './access.rules';

const registry = new Map<Function, EntityAccessConfig>();

export const PermissionRegistry = {
  /**
   * Регистрирует конфиг сущности, дополняя предыдущий (поля и операции
   * из более ранней регистрации сохраняются, если новая их не задаёт).
   */
  set(entity: Function, config: EntityAccessConfig): void {
    const prev = registry.get(entity);
    const defined = Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined),
    );
    registry.set(entity, { ...prev, ...defined });
  },

  get(entity: Function): EntityAccessConfig | undefined {
    return registry.get(entity);
  },

  /**
   * Путь владельца сущности: первый scope.owner из read-правил.
   * Используется для проверки прицепляемых связей (sanitize)
   * и фильтрации вложенных отношений (nested_filter).
   */
  getOwnerPath(entity: Function): string | undefined {
    const read = registry.get(entity)?.operations?.read || [];
    for (const rule of read) {
      if (rule.scope && typeof rule.scope === 'object' && 'owner' in rule.scope) {
        return rule.scope.owner;
      }
    }
    return undefined;
  },

  has(entity: Function): boolean {
    return registry.has(entity);
  },

  delete(entity: Function): boolean {
    return registry.delete(entity);
  },

  clear(): void {
    registry.clear();
  },

  entries(): IterableIterator<[Function, EntityAccessConfig]> {
    return registry.entries();
  },
};
