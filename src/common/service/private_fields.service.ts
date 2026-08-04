import { AccessLevel } from '../access.type';
import {
  FIELD_ACCESS_METADATA,
  FieldAccessOptions,
} from '../decorator/field_access.decorator';
import { OWNER_TABLE } from './owner.service';

function canRead(level: AccessLevel, bind: any, dto: any): boolean {
  if (!bind) return level === 'public';
  switch (level) {
    case 'public':
      return true;
    case 'account':
      return bind.id !== undefined || bind.allow === true;
    case 'tenant':
      return bind.tenantId !== undefined || bind.allow === true;
    case 'owner':
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
            .reduce((acc: any, segment: string) => acc?.[segment], dto);
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
    case 'superuser':
      return !!bind.allow;
    case 'closed':
      return false;
    default:
      return true;
  }
}

function canWrite(level: AccessLevel, bind: any): boolean {
  if (!bind) return level === 'public';
  switch (level) {
    case 'public':
      return true;
    case 'account':
      return bind?.id !== undefined || bind?.allow === true;
    case 'tenant':
      return bind?.tenantId !== undefined || bind?.allow === true;
    case 'owner':
      return true;
    case 'superuser':
      return !!bind?.allow;
    case 'closed':
      return false;
    default:
      return true;
  }
}

export const removePrivateFields = (
  result: any | any[],
  bind: any,
): any | any[] => {
  const seen = new WeakSet();
  if (Array.isArray(result)) {
    result.forEach((entry) => entry && processDto(entry, bind, seen));
  } else if (result && typeof result === 'object') {
    processDto(result, bind, seen);
  }
  return result;
};

function computeNestedBind(bind: any, key: string): any {
  if (!bind) return bind;
  const name = bind.name || '';
  if (name.startsWith(key + '.')) {
    return { ...bind, name: name.slice(key.length + 1) };
  }
  return { ...bind, name: '' };
}

const metadataCache = new WeakMap<object, Map<string, FieldAccessOptions | undefined>>();

function getCachedFieldAccess(proto: object, key: string): FieldAccessOptions | undefined {
  let fieldMap = metadataCache.get(proto);
  if (!fieldMap) {
    fieldMap = new Map();
    metadataCache.set(proto, fieldMap);
  }
  if (!fieldMap.has(key)) {
    fieldMap.set(key, Reflect.getMetadata(FIELD_ACCESS_METADATA, proto, key));
  }
  return fieldMap.get(key);
}

const processDto = (dto: any, bind: any, seen: WeakSet<object>): void => {
  if (!dto || typeof dto !== 'object' || seen.has(dto)) return;
  seen.add(dto);

  const proto = dto.constructor?.prototype;

  for (const key of Object.keys(dto)) {
    const fieldAccess: FieldAccessOptions | undefined = proto
      ? getCachedFieldAccess(proto, key)
      : undefined;

    if (fieldAccess?.read && fieldAccess.read !== 'public') {
      if (!canRead(fieldAccess.read, bind, dto)) {
        delete dto[key];
        continue;
      }
    }

    const value = dto[key];
    if (value && typeof value === 'object') {
      const nestedBind = computeNestedBind(bind, key);
      if (Array.isArray(value)) {
        value.forEach((item) => item && processDto(item, nestedBind, seen));
      } else if (
        value.constructor &&
        value.constructor !== Object &&
        value.constructor !== Date
      ) {
        processDto(value, nestedBind, seen);
      }
    }
  }
};

export const stripWriteFields = (
  dto: any,
  entityTarget: any,
  bind: any,
): void => {
  if (!dto || typeof dto !== 'object') return;

  const proto = entityTarget?.prototype;
  if (!proto) return;

  const bindField = bind?.name ? bind.name.split('.')[0] : undefined;

  for (const key of Object.keys(dto)) {
    const fieldAccess: FieldAccessOptions | undefined = Reflect.getMetadata(
      FIELD_ACCESS_METADATA,
      proto,
      key,
    );

    let writeLevel: AccessLevel | undefined = fieldAccess?.write;

    if (!writeLevel && bindField && key === bindField) {
      writeLevel = 'closed';
    }

    if (!writeLevel || writeLevel === 'public') continue;

    if (!canWrite(writeLevel, bind)) {
      delete dto[key];
    }
  }
};