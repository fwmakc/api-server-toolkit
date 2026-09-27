import { DataSource, EntityMetadata } from 'typeorm';
import { PermissionRegistry } from './permission.registry';
import { AccessRule, EntityAccessConfig } from './access.rules';

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Валидирует все зарегистрированные конфиги доступа против метаданных TypeORM.
 * Вызывать на старте (AccessModule.forRoot()): ошибка конфигурации должна
 * ронять сервис при деплое, а не открывать дыру в рантайме.
 * Сущности, отсутствующие в этом DataSource, пропускаются.
 */
export function validateAccessRegistry(dataSource: DataSource): void {
  const errors: string[] = [];

  for (const [entity, config] of PermissionRegistry.entries()) {
    let metadata: EntityMetadata;
    try {
      metadata = dataSource.getMetadata(entity);
    } catch {
      continue;
    }
    errors.push(...validateEntityAccess(metadata, config));
  }

  if (errors.length) {
    throw new Error(
      `Access configuration errors (${errors.length}):\n` +
        errors.map((e) => `  - ${e}`).join('\n'),
    );
  }
}

export function validateEntityAccess(
  metadata: EntityMetadata,
  config: EntityAccessConfig,
): string[] {
  const label = metadata.name;
  const errors: string[] = [];

  const ops = config.operations || {};
  for (const op of ['read', 'create', 'update', 'delete'] as const) {
    (ops[op] || []).forEach((rule, i) =>
      validateRule(`${label}.${op}[${i}]`, rule, metadata, errors, false),
    );
  }

  for (const [fieldName, fieldRule] of Object.entries(config.fields || {})) {
    const fLabel = `${label}.fields.${fieldName}`;
    if (!columnOrRelation(metadata, fieldName)) {
      errors.push(`${fLabel}: '${fieldName}' is not a column or relation`);
    }
    (fieldRule.response || []).forEach((rule, i) =>
      validateRule(`${fLabel}.response[${i}]`, rule, metadata, errors, true),
    );
    (fieldRule.request || []).forEach((rule, i) =>
      validateRule(`${fLabel}.request[${i}]`, rule, metadata, errors, true),
    );
  }

  return errors;
}

function validateRule(
  label: string,
  rule: AccessRule,
  metadata: EntityMetadata,
  errors: string[],
  isFieldRule: boolean,
): void {
  (rule.who || []).forEach((w) => {
    if (typeof w !== 'string' || !IDENT.test(w)) {
      errors.push(`${label}: who entry '${String(w)}' must be a role name`);
    }
  });

  const scope = rule.scope;
  if (scope !== undefined && scope !== 'all') {
    if (typeof scope !== 'object') {
      errors.push(`${label}: scope must be 'all' | { tenant: path } | { owner: path }`);
    } else {
      const keys = Object.keys(scope);
      const kind = keys[0];
      if (keys.length !== 1 || (kind !== 'tenant' && kind !== 'owner')) {
        errors.push(`${label}: scope must be 'all' | { tenant: path } | { owner: path }`);
      } else {
        const path = (scope as Record<string, unknown>)[kind];
        if (typeof path !== 'string' || !path.split('.').every((s) => IDENT.test(s))) {
          errors.push(`${label}: scope.${kind} — invalid path '${String(path)}'`);
        } else {
          const err = resolvePathError(metadata, path);
          if (err) errors.push(`${label}: scope.${kind} '${path}' — ${err}`);
        }
      }
    }
    if (isFieldRule) {
      errors.push(`${label}: scope is not supported in field rules — row is already scoped by the operation`);
    }
  }

  for (const key of Object.keys(rule.filter || {})) {
    const first = key.split('.')[0];
    if (!columnOrRelation(metadata, first)) {
      errors.push(`${label}: filter key '${key}' — '${first}' is not a column or relation`);
    }
  }
}

function resolvePathError(
  metadata: EntityMetadata,
  path: string,
): string | null {
  const segments = path.split('.');
  let meta = metadata;
  for (let i = 0; i < segments.length - 1; i++) {
    const rel = meta.relations.find((r) => r.propertyName === segments[i]);
    if (!rel) return `relation '${segments[i]}' not found on ${meta.name}`;
    meta = rel.inverseEntityMetadata;
  }
  const last = segments[segments.length - 1];
  if (meta.columns.some((c) => c.propertyName === last)) return null;
  const rel = meta.relations.find((r) => r.propertyName === last);
  if (rel) {
    return rel.inverseEntityMetadata.columns.some((c) => c.propertyName === 'id')
      ? null
      : `relation '${last}' target has no 'id' column`;
  }
  return `column or relation '${last}' not found on ${meta.name}`;
}

function columnOrRelation(metadata: EntityMetadata, name: string): boolean {
  return (
    metadata.columns.some((c) => c.propertyName === name) ||
    metadata.relations.some((r) => r.propertyName === name)
  );
}
