import { Type } from '@nestjs/common';

export type AccessLevel =
  | 'public'
  | 'account'
  | 'tenant'
  | 'owner'
  | 'superuser'
  | 'closed';

export interface AccountInfo {
  id: number | string;
  username?: string;
  isActivated?: boolean;
  isSuperuser?: boolean;
  tenantId?: number | string;
  roles?: string[];
}

export type OperationAccess =
  | AccessLevel
  | { level: 'owner'; bindPath?: string };

export interface OperationConfig {
  create: OperationAccess;
  read: OperationAccess;
  update: OperationAccess;
  delete: OperationAccess;
}

export interface EntityPermissionConfig extends OperationConfig {
  accountTable?: string;
  accountField?: string;
  tenantTable?: string;
  tenantField?: string;
}

export type RoleEntry = string | { role: string; tenant: 'own' | 'all' | string[] };

export function normalizeRoles(roles: RoleEntry[] | undefined): string[] {
  if (!roles?.length) return [];
  return roles.map((r) => (typeof r === 'string' ? r : r.role));
}

export interface EntityControllerOptions {
  name: string;
  dto: any;
  entity: Type<unknown>;
  accountTable?: string;
  accountField?: string;
  tenantTable?: string;
  tenantField?: string;
  operations?: Partial<OperationConfig>;
  roles?: Partial<Record<'create' | 'read' | 'update' | 'delete', RoleEntry[]>>;
  relations?: string[];
}

export function normalizeAccess(
  access: OperationAccess | undefined,
  fallback: AccessLevel = 'closed',
): AccessLevel {
  if (access === undefined) return fallback;
  if (typeof access === 'string') return access;
  return access.level;
}

export function getBindPath(
  access: OperationAccess | undefined,
  fallback: string,
): string | undefined {
  if (access && typeof access === 'object' && access.bindPath) {
    return access.bindPath;
  }
  if (
    access === 'owner' ||
    (typeof access === 'object' && access?.level === 'owner')
  ) {
    return fallback;
  }
  return undefined;
}
