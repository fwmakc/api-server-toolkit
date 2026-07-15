import { OperationConfig, OperationAccess } from './access.type';
export declare const PermissionRegistry: {
    set(entity: any, config: OperationConfig): void;
    get(entity: any): OperationConfig | undefined;
    getCreate(entity: any): OperationAccess;
    getRead(entity: any): OperationAccess;
    getUpdate(entity: any): OperationAccess;
    getDelete(entity: any): OperationAccess;
    has(entity: any): boolean;
    delete(entity: any): boolean;
    clear(): void;
};
