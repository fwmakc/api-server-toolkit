import { Repository } from 'typeorm';

export async function softRemove<Entity>(
  repo: Repository<Entity>,
  id: number | string,
  softDeleteCol: string,
): Promise<boolean> {
  const result = await repo.update(id, { [softDeleteCol]: new Date() } as any);
  return !!result?.affected;
}

export async function hardRemove<Entity>(
  repo: Repository<Entity>,
  id: number | string,
): Promise<boolean> {
  const result = await repo.delete(id);
  return !!result?.affected;
}

export async function restoreDeleted<Entity>(
  repo: Repository<Entity>,
  id: number | string,
  softDeleteCol: string,
): Promise<boolean> {
  const result = await repo.update(id, { [softDeleteCol]: null } as any);
  return !!result?.affected;
}
