import { Type } from '@nestjs/common';
export type AccessLevel = 'public' | 'account' | 'owner' | 'admin' | 'closed';
export interface AccountLike {
    id: number | string;
    username?: string;
    isActivated?: boolean;
    isSuperuser?: boolean;
}
export type OperationAccess = AccessLevel | {
    level: 'owner';
    bindPath?: string;
};
export interface OperationConfig {
    create: OperationAccess;
    read: OperationAccess;
    update: OperationAccess;
    delete: OperationAccess;
}
export interface EntityControllerOptions {
    name: string;
    dto: any;
    entity: Type<unknown>;
    accountTable?: string;
    accountField?: string;
    operations?: Partial<OperationConfig>;
}
export declare function normalizeAccess(access: OperationAccess | undefined, fallback?: AccessLevel): AccessLevel;
export declare function getBindPath(access: OperationAccess | undefined, fallback: string): string | undefined;
