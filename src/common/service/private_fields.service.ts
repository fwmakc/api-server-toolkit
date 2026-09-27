import { PermissionRegistry } from '../permission.registry';
import { matchRoles, rolesOf } from '../access.rules';
import { BindDto } from '../dto/bind.dto';
import { isSuperuser } from './admin.service';

/**
 * Аккаунт или BindDto: полям нужны только роли и признак байпаса.
 * (Сервисные вызовы передают bind — у него есть allow.)
 */
export type FieldAccount =
  | { roles?: string[]; isSuperuser?: boolean }
  | BindDto
  | undefined
  | null;

function isBypass(account: FieldAccount): boolean {
  return isSuperuser(account as any) || (account as BindDto)?.allow === true;
}

const MAX_DEPTH = 10;

interface FieldContext {
  roles: string[];
  bypass: boolean;
}

/**
 * Вырезает из ответа поля, не прошедшие fields[].response правила.
 * Конфиг берётся из PermissionRegistry по классу объекта (entity),
 * вложенные сущности обрабатываются по их собственным конфигам.
 */
export const removePrivateFields = (
  result: unknown | unknown[],
  account?: FieldAccount,
): unknown | unknown[] => {
  const ctx: FieldContext = {
    roles: rolesOf(account as any),
    bypass: isSuperuser(account as any),
  };
  const seen = new WeakSet();
  if (Array.isArray(result)) {
    result.forEach((entry) => entry && processDto(entry, ctx, seen, 0));
  } else if (result && typeof result === 'object') {
    processDto(result, ctx, seen, 0);
  }
  return result;
};

function processDto(
  dto: any,
  ctx: FieldContext,
  seen: WeakSet<object>,
  depth: number,
): void {
  if (!dto || typeof dto !== 'object' || seen.has(dto) || depth > MAX_DEPTH) return;
  seen.add(dto);

  const config = dto.constructor ? PermissionRegistry.get(dto.constructor) : undefined;

  for (const key of Object.keys(dto)) {
    if (!ctx.bypass) {
      const response = config?.fields?.[key]?.response;
      if (response?.length && !matchRoles(response, ctx.roles)) {
        delete dto[key];
        continue;
      }
    }

    const value = dto[key];
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((item) => item && processDto(item, ctx, seen, depth + 1));
      } else if (
        value.constructor &&
        value.constructor !== Object &&
        value.constructor !== Date
      ) {
        processDto(value, ctx, seen, depth + 1);
      }
    }
  }
}

/**
 * Вырезает из входящего DTO поля, не прошедшие fields[].request правила.
 * Поле-владелец (первый сегмент scope.owner) вырезается всегда —
 * оно проставляется сервером (штамп), клиент не может его подделать.
 */
export const stripWriteFields = (
  dto: any,
  entityTarget: Function | string,
  bind?: BindDto,
  account?: FieldAccount,
): void => {
  if (!dto || typeof dto !== 'object') return;
  if (isBypass(account) || bind?.allow === true) return;

  // Роли: из аккаунта (вывод через rolesOf), иначе из bind (уже эффективные),
  // иначе — пусто (аноним): правила, требующие ролей, вырезаются.
  const roles = account ? rolesOf(account as any) : bind?.roles?.length ? [...bind.roles] : [];
  const config =
    typeof entityTarget === 'function' ? PermissionRegistry.get(entityTarget) : undefined;
  const bindField = bind?.name ? bind.name.split('.')[0] : undefined;

  for (const key of Object.keys(dto)) {
    if (bindField && key === bindField) {
      delete dto[key];
      continue;
    }

    const request = config?.fields?.[key]?.request;
    if (request?.length && !matchRoles(request, roles)) {
      delete dto[key];
    }
  }
};
