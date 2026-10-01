import { Repository } from 'typeorm';

// Скоуп в самом UPDATE/DELETE закрывает гонку check-then-act: смена
// owner/tenant строки между existsInScope и записью не протекает сквозь.
export async function softRemove<Entity>(
  repo: Repository<Entity>,
  id: number | string,
  softDeleteCol: string,
  scopeWhere: Record<string, any> = {},
): Promise<boolean> {
  const result = await repo.update({ ...scopeWhere, id } as any, {
    [softDeleteCol]: new Date(),
  } as any);
  return !!result?.affected;
}

export async function hardRemove<Entity>(
  repo: Repository<Entity>,
  id: number | string,
  scopeWhere: Record<string, any> = {},
): Promise<boolean> {
  const result = await repo.delete({ ...scopeWhere, id } as any);
  return !!result?.affected;
}

export async function restoreDeleted<Entity>(
  repo: Repository<Entity>,
  id: number | string,
  softDeleteCol: string,
  scopeWhere: Record<string, any> = {},
): Promise<boolean> {
  const result = await repo.update({ ...scopeWhere, id } as any, {
    [softDeleteCol]: null,
  } as any);
  return !!result?.affected;
}
