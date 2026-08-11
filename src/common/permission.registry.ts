import {
  AccessLevel,
  EntityPermissionConfig,
  OperationConfig,
  OperationAccess,
} from './access.type';

const registry = new Map<any, EntityPermissionConfig>();

export const PermissionRegistry = {
  set(entity: any, config: EntityPermissionConfig): void {
    registry.set(entity, config);
  },

  get(entity: any): EntityPermissionConfig | undefined {
    return registry.get(entity);
  },

  getAccountTable(entity: any): string | undefined {
    return registry.get(entity)?.accountTable;
  },

  getAccountField(entity: any): string | undefined {
    return registry.get(entity)?.accountField;
  },

  getTenantTable(entity: any): string | undefined {
    return registry.get(entity)?.tenantTable;
  },

  getTenantField(entity: any): string | undefined {
    return registry.get(entity)?.tenantField;
  },

  getCreate(entity: any): OperationAccess {
    return registry.get(entity)?.create ?? AccessLevel.CLOSED;
  },

  getRead(entity: any): OperationAccess {
    return registry.get(entity)?.read ?? AccessLevel.CLOSED;
  },

  getUpdate(entity: any): OperationAccess {
    return registry.get(entity)?.update ?? AccessLevel.CLOSED;
  },

  getDelete(entity: any): OperationAccess {
    return registry.get(entity)?.delete ?? AccessLevel.CLOSED;
  },

  has(entity: any): boolean {
    return registry.has(entity);
  },

  delete(entity: any): boolean {
    return registry.delete(entity);
  },

  clear(): void {
    registry.clear();
  },
};
