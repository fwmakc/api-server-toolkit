import { AccessLevel } from '../access.type';
import {
  FIELD_ACCESS_METADATA,
  FieldAccessOptions,
} from '../decorator/field_access.decorator';
import {
  FIELD_ROLES_METADATA,
  FieldRolesOptions,
} from '../decorator/field_roles.decorator';
import { OWNER_TABLE } from './owner.service';
import { isSuperuser } from './admin.service';
import { BindDto } from '../dto/bind.dto';

function canRead(level: AccessLevel, bind: BindDto | undefined, dto: Record<string, unknown>): boolean {
  if (!bind) return level === AccessLevel.PUBLIC;
  switch (level) {
    case AccessLevel.PUBLIC:
      return true;
    case AccessLevel.ACCOUNT:
      return bind.id !== undefined || bind.allow === true;
    case AccessLevel.TENANT:
      return bind.tenantId !== undefined || bind.allow === true;
    case AccessLevel.OWNER:
      if (bind.allow) return true;
      if (bind.id === undefined) return false;
      {
        const { id, key = 'id', name = OWNER_TABLE } = bind;
        let ownerEntity;
        if (name === '') {
          ownerEntity = dto;
        } else if (name.includes('.')) {
          ownerEntity = name
            .split('.')
            .reduce((acc: unknown, segment: string) => (acc as Record<string, unknown>)?.[segment], dto);
          if (!ownerEntity) return false;
        } else {
          ownerEntity = dto?.[name];
        }
        const ownerId = ownerEntity?.[key];
        const ownerIdFallback =
          name === '' ? undefined : dto?.[name + 'Id'];
        return (
          String(ownerId) === String(id) ||
          String(ownerIdFallback) === String(id)
        );
      }
    case AccessLevel.SUPERUSER:
      return !!bind.allow;
    case AccessLevel.CLOSED:
      return false;
    default:
      return true;
  }
}

function canWrite(level: AccessLevel, bind: BindDto | undefined): boolean {
  if (!bind) return level === AccessLevel.PUBLIC;
  switch (level) {
    case AccessLevel.PUBLIC:
      return true;
    case AccessLevel.ACCOUNT:
      return bind?.id !== undefined || bind?.allow === true;
    case AccessLevel.TENANT:
      return bind?.tenantId !== undefined || bind?.allow === true;
    case AccessLevel.OWNER:
      return true;
    case AccessLevel.SUPERUSER:
      return !!bind?.allow;
    case AccessLevel.CLOSED:
      return false;
    default:
      return true;
  }
}

function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (!requiredRoles?.length) return true;
  if (!userRoles?.length) return false;
  return requiredRoles.some((role) => userRoles.includes(role));
}

export const removePrivateFields = (
  result: unknown | unknown[],
  bind: BindDto | undefined,
  account?: any,
): unknown | unknown[] => {
  const seen = new WeakSet();
  const userRoles = account?.roles || bind?.roles || [];
  const bypass = isSuperuser(account);
  if (Array.isArray(result)) {
    result.forEach((entry) => entry && processDto(entry, bind, seen, userRoles, bypass));
  } else if (result && typeof result === 'object') {
    processDto(result, bind, seen, userRoles, bypass);
  }
  return result;
};

function computeNestedBind(bind: BindDto | undefined, key: string): BindDto | undefined {
  if (!bind) return bind;
  const name = bind.name || '';
  if (name.startsWith(key + '.')) {
    return { ...bind, name: name.slice(key.length + 1) };
  }
  return { ...bind, name: '' };
}

const fieldAccessCache = new WeakMap<object, Map<string, FieldAccessOptions | undefined>>();
const fieldRolesCache = new WeakMap<object, Map<string, FieldRolesOptions | undefined>>();

function getCachedFieldAccess(proto: object, key: string): FieldAccessOptions | undefined {
  let fieldMap = fieldAccessCache.get(proto);
  if (!fieldMap) {
    fieldMap = new Map();
    fieldAccessCache.set(proto, fieldMap);
  }
  if (!fieldMap.has(key)) {
    fieldMap.set(key, Reflect.getMetadata(FIELD_ACCESS_METADATA, proto, key));
  }
  return fieldMap.get(key);
}

function getCachedFieldRoles(proto: object, key: string): FieldRolesOptions | undefined {
  let fieldMap = fieldRolesCache.get(proto);
  if (!fieldMap) {
    fieldMap = new Map();
    fieldRolesCache.set(proto, fieldMap);
  }
  if (!fieldMap.has(key)) {
    fieldMap.set(key, Reflect.getMetadata(FIELD_ROLES_METADATA, proto, key));
  }
  return fieldMap.get(key);
}

const processDto = (
  dto: any,
  bind: BindDto | undefined,
  seen: WeakSet<object>,
  userRoles: string[],
  bypass: boolean,
): void => {
  if (!dto || typeof dto !== 'object' || seen.has(dto)) return;
  seen.add(dto);

  const proto = dto.constructor?.prototype;

  for (const key of Object.keys(dto)) {
    const fieldAccess: FieldAccessOptions | undefined = proto
      ? getCachedFieldAccess(proto, key)
      : undefined;

    const fieldRoles: FieldRolesOptions | undefined = proto
      ? getCachedFieldRoles(proto, key)
      : undefined;

    if (bypass) continue;

    const accessRestricted = fieldAccess?.read && fieldAccess.read !== AccessLevel.PUBLIC;
    const rolesRestricted = fieldRoles?.read?.length > 0;

    if (accessRestricted && !rolesRestricted) {
      if (!canRead(fieldAccess.read, bind, dto)) {
        delete dto[key];
        continue;
      }
    } else if (accessRestricted && rolesRestricted) {
      const accessPass = canRead(fieldAccess.read, bind, dto);
      const rolesPass = hasAnyRole(userRoles, fieldRoles.read);

      if (!accessPass && !rolesPass) {
        delete dto[key];
        continue;
      }
    } else if (rolesRestricted) {
      if (!hasAnyRole(userRoles, fieldRoles.read)) {
        delete dto[key];
        continue;
      }
    }

    const value = dto[key];
    if (value && typeof value === 'object') {
      const nestedBind = computeNestedBind(bind, key);
      if (Array.isArray(value)) {
        value.forEach((item) => item && processDto(item, nestedBind, seen, userRoles, bypass));
      } else if (
        value.constructor &&
        value.constructor !== Object &&
        value.constructor !== Date
      ) {
        processDto(value, nestedBind, seen, userRoles, bypass);
      }
    }
  }
};

export const stripWriteFields = (
  dto: any,
  entityTarget: Function | string,
  bind: BindDto | undefined,
  account?: any,
): void => {
  if (!dto || typeof dto !== 'object') return;

  const proto = typeof entityTarget === 'function' ? entityTarget.prototype : undefined;
  if (!proto) return;

  const bindField = bind?.name ? bind.name.split('.')[0] : undefined;
  const userRoles = account?.roles || bind?.roles || [];
  const bypass = isSuperuser(account);

  for (const key of Object.keys(dto)) {
    if (bypass) continue;

    const fieldAccess: FieldAccessOptions | undefined = Reflect.getMetadata(
      FIELD_ACCESS_METADATA,
      proto,
      key,
    );

    const fieldRoles: FieldRolesOptions | undefined = Reflect.getMetadata(
      FIELD_ROLES_METADATA,
      proto,
      key,
    );

    let writeLevel: AccessLevel | undefined = fieldAccess?.write;

    if (!writeLevel && bindField && key === bindField) {
      writeLevel = AccessLevel.CLOSED;
    }

    const accessRestricted = writeLevel && writeLevel !== AccessLevel.PUBLIC;
    const rolesRestricted = fieldRoles?.write?.length > 0;

    if (accessRestricted && !rolesRestricted) {
      if (!canWrite(writeLevel, bind)) {
        delete dto[key];
      }
    } else if (accessRestricted && rolesRestricted) {
      const accessPass = canWrite(writeLevel, bind);
      const rolesPass = hasAnyRole(userRoles, fieldRoles.write);

      if (!accessPass && !rolesPass) {
        delete dto[key];
      }
    } else if (rolesRestricted) {
      if (!hasAnyRole(userRoles, fieldRoles.write)) {
        delete dto[key];
      }
    }
  }
};
