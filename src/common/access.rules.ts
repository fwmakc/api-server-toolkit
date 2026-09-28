import { AccountInfo, RoleName } from './access.type';
import { BindDto } from './dto/bind.dto';
import { isSuperuser } from './service/admin.service';

/**
 * Псевдо-роли:
 *  - 'public'       — синтезируется guard'ом для анонимного запроса (без JWT);
 *  - 'authenticated'- добавляется guard'ом каждому вошедшему;
 *  - 'superuser'    — зарезервированное имя: суперюзер проходит всё через байпас,
 *                     явное указание в who нужно только для самодокументации/Swagger.
 */
export const PUBLIC_ROLE = 'public';
export const AUTHENTICATED_ROLE = 'authenticated';
export const SUPERUSER_ROLE = 'superuser';
/** Роль клиентов с API-ключом (ApiKeyGuard): { who: ['api'] } открывает маршрут интеграциям. */
export const API_ROLE = 'api';

export type OperationName = 'read' | 'create' | 'update' | 'delete';

/**
 * Скоуп правила:
 *  - 'all'              — без строчного фильтра;
 *  - { tenant: 'tenant.id' }   — только строки своего тенанта (путь до колонки);
 *  - { owner: 'author.id' }    — только «свои» строки (путь до владельца).
 * Один сегмент = имя связи с ключом 'id'; специальное значение 'id' — собственная
 * колонка id сущности (например, для самой таблицы аккаунтов).
 */
export type AccessScope = 'all' | { tenant: string } | { owner: string };

export interface AccessRule {
  /** Кому разрешено. Пусто/не задано = ['authenticated']. Массив = OR. */
  who?: RoleName[];
  /** Какие строки затрагивает операция. Не задано = 'all'. */
  scope?: AccessScope;
  /** Форс-условия поверх пользовательского where (фильтр всегда сильнее). */
  filter?: Record<string, unknown>;
}

export interface FieldRule {
  /** Правила на поле в ответах сервера. Не совпало — поле вырезается из ответа. */
  response?: AccessRule[];
  /** Правила на поле во входящих данных. Не совпало — поле вырезается из запроса. */
  request?: AccessRule[];
}

export interface EntityAccessConfig {
  operations?: Partial<Record<OperationName, AccessRule[]>>;
  /** Поля и связи — тот же механизм: имя поля/связи → правила response/request. */
  fields?: Record<string, FieldRule>;
}

export function normalizeRuleNames(who: RoleName[] | undefined): RoleName[] {
  if (!who?.length) return [AUTHENTICATED_ROLE];
  return who;
}

/** Добавляет 'authenticated' реальному пользователю (мутации нет — копия). */
export function normalizeAccount(
  account: AccountInfo | undefined | null,
): AccountInfo | undefined {
  if (!account) return undefined;
  const roles = [...(account.roles || [])];
  if (!roles.includes(AUTHENTICATED_ROLE)) roles.push(AUTHENTICATED_ROLE);
  return { ...account, roles };
}

/** Анонимный запрос: guard синтезирует псевдо-аккаунт с ролью 'public'. */
export function anonymousAccount(): AccountInfo {
  return { roles: [PUBLIC_ROLE] } as AccountInfo;
}

export interface MatchedRule {
  rule: AccessRule;
  /** Совпавшие имена из who. */
  roles: RoleName[];
  /** Эффективный скоуп: роль совпавшего пользователя с tenant:'all' расширяет любой скоуп до 'all'. */
  scope: AccessScope;
}

/**
 * Эффективные роли: настоящий (не анонимный) аккаунт неявно содержит
 * 'authenticated', даже если guard не успел нормализовать роли.
 */
export function rolesOf(account: Partial<AccountInfo> | undefined | null): string[] {
  if (!account) return [];
  const effective = [...(account.roles || [])];
  const anonymous = effective.includes(PUBLIC_ROLE) && account.id === undefined;
  if (!anonymous && !effective.includes(AUTHENTICATED_ROLE)) {
    effective.push(AUTHENTICATED_ROLE);
  }
  return effective;
}

function widenScope(
  scope: AccessScope,
  account: AccountInfo | undefined | null,
  matched: RoleName[],
): AccessScope {
  if (scope === 'all') return scope;
  const entries = account?.roleEntries;
  if (!entries?.length) return scope;
  const widened = entries.some(
    (e) => matched.includes(e.role) && e.tenant === 'all',
  );
  return widened ? 'all' : scope;
}

/**
 * Первое совпавшее правило (массив правил = OR, порядок значим).
 * Роль 'public' совпадает только у анонима (синтезированный аккаунт).
 */
export function matchRule(
  rules: AccessRule[] | undefined,
  account: AccountInfo | undefined | null,
): MatchedRule | undefined {
  if (!rules?.length) return undefined;
  const userRoles = rolesOf(account);
  for (const rule of rules) {
    const who = normalizeRuleNames(rule.who);
    const matched = who.filter((r) => userRoles.includes(r));
    if (!matched.length) continue;
    return { rule, roles: matched, scope: widenScope(rule.scope ?? 'all', account, matched) };
  }
  return undefined;
}

/** Совпадает ли пользователь хотя бы с одним правилом (для полей: кто видит/пишет). */
export function matchWho(
  rules: AccessRule[] | undefined,
  account: Partial<AccountInfo> | undefined | null,
): boolean {
  return matchRoles(rules, rolesOf(account));
}

/** Как matchWho, но по готовому набору ролей (без вывода ролей из аккаунта). */
export function matchRoles(rules: AccessRule[] | undefined, roles: string[]): boolean {
  if (!rules?.length) return true;
  return rules.some((rule) => {
    const who = normalizeRuleNames(rule.who);
    return who.some((r) => roles.includes(r));
  });
}

/** 'author.id' → {name:'author', key:'id'}; 'id' → {name:'', key:'id'}; 'author' → {name:'author', key:'id'}. */
export function parseAccessPath(path: string): { name: string; key: string } {
  if (path === 'id') return { name: '', key: 'id' };
  const idx = path.lastIndexOf('.');
  if (idx === -1) return { name: path, key: 'id' };
  return { name: path.slice(0, idx), key: path.slice(idx + 1) };
}

/**
 * Совпавшее правило → BindDto (внутренний мост к find/write/delete helper'ам).
 * Суперюзер → {allow:true}; scope 'all' → без фильтра (undefined);
 * owner → {id, key, name}; tenant → {tenantId, tenantKey, tenantName}.
 */
export function compileRuleToBind(
  matched: MatchedRule | undefined,
  account: AccountInfo | undefined | null,
): BindDto | undefined {
  if (!matched) return undefined;
  const roles = rolesOf(account);
  if (isSuperuser(account)) return { allow: true, roles };

  const { scope } = matched;
  if (scope === 'all') return undefined;

  if ('owner' in scope) {
    const { name, key } = parseAccessPath(scope.owner);
    return name
      ? { id: account?.id, key, name, roles }
      : { id: account?.id, key: 'id', roles };
  }

  const { name, key } = parseAccessPath(scope.tenant);
  return {
    tenantName: name,
    tenantKey: key,
    tenantId: account?.tenantId,
    roles,
  };
}

/** matchRule + compileRuleToBind одним вызовом — для хендлеров. */
export function accessBind(
  rules: AccessRule[] | undefined,
  account: AccountInfo | undefined | null,
): BindDto | undefined {
  return compileRuleToBind(matchRule(rules, account), account);
}

/** Есть ли среди правил разрешение анониму (маршрут с необязательным JWT). */
export function isPublicRules(rules: AccessRule[] | undefined): boolean {
  if (!rules?.length) return false;
  return rules.some((r) =>
    (r.who?.length ? r.who : [AUTHENTICATED_ROLE]).includes(PUBLIC_ROLE),
  );
}
