export type TenantStrategy = 'where' | 'schema' | 'database';

export function getTenantStrategy(): TenantStrategy {
  const env = process.env.TENANT_STRATEGY;
  if (env === 'schema' || env === 'database') return env;
  return 'where';
}
