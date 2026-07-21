import { EntityPermissionConfig, OperationAccess } from './access.type';
export declare const PermissionRegistry: {
    set(entity: any, config: EntityPermissionConfig): void;
    get(entity: any): EntityPermissionConfig | undefined;
    getAccountTable(entity: any): string | undefined;
    getCreate(entity: any): OperationAccess;
    getRead(entity: any): OperationAccess;
    getUpdate(entity: any): OperationAccess;
    getDelete(entity: any): OperationAccess;
    has(entity: any): boolean;
    delete(entity: any): boolean;
    clear(): void;
};
