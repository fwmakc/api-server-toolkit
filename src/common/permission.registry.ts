import {
  AccessLevel,
  EntityPermissionConfig,
  OperationConfig,
  OperationAccess,
} from './access.type';

const registry = new Map<Function, EntityPermissionConfig>();

export const PermissionRegistry = {
  set(entity: Function, config: EntityPermissionConfig): void {
    registry.set(entity, config);
  },

  get(entity: Function): EntityPermissionConfig | undefined {
    return registry.get(entity);
  },

  getAccountTable(entity: Function): string | undefined {
    return registry.get(entity)?.accountTable;
  },

  getAccountField(entity: Function): string | undefined {
    return registry.get(entity)?.accountField;
  },

  getTenantTable(entity: Function): string | undefined {
    return registry.get(entity)?.tenantTable;
  },

  getTenantField(entity: Function): string | undefined {
    return registry.get(entity)?.tenantField;
  },

  getCreate(entity: Function): OperationAccess {
    return registry.get(entity)?.create ?? AccessLevel.CLOSED;
  },

  getRead(entity: Function): OperationAccess {
    return registry.get(entity)?.read ?? AccessLevel.CLOSED;
  },

  getUpdate(entity: Function): OperationAccess {
    return registry.get(entity)?.update ?? AccessLevel.CLOSED;
  },

  getDelete(entity: Function): OperationAccess {
    return registry.get(entity)?.delete ?? AccessLevel.CLOSED;
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
};
