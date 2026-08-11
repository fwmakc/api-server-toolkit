export interface FieldRolesOptions {
  read?: string[];
  write?: string[];
}

export const FIELD_ROLES_METADATA = 'fieldRoles';

export function FieldRoles(options: FieldRolesOptions) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(FIELD_ROLES_METADATA, options, target, propertyKey);
  };
}
