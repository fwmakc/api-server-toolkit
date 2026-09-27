export enum TenantScope {
  OWN = 'own',
  ALL = 'all',
}

export type RoleName = string;

export type TenantScopeValue = TenantScope | string | string[];

export interface RoleEntry {
  role: RoleName;
  tenant?: TenantScopeValue;
}

export interface AccountInfo {
  id: number | string;
  username?: string;
  isActivated?: boolean;
  isSuperuser?: boolean;
  tenantId?: number | string;
  roles?: string[];
  roleEntries?: Array<{ role: string; tenant?: string }>;
}
