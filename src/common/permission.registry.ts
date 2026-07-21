import {
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

  getCreate(entity: any): OperationAccess {
    return registry.get(entity)?.create ?? 'closed';
  },

  getRead(entity: any): OperationAccess {
    return registry.get(entity)?.read ?? 'closed';
  },

  getUpdate(entity: any): OperationAccess {
    return registry.get(entity)?.update ?? 'closed';
  },

  getDelete(entity: any): OperationAccess {
    return registry.get(entity)?.delete ?? 'closed';
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
