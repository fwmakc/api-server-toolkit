import { EntityMetadata } from 'typeorm';

export function getUniqueColumns(metadata: EntityMetadata): Array<string[]> {
  const uniques: Array<string[]> = [];
  metadata.indices.forEach((index) => {
    if (index.isUnique) {
      const cols = (index.columns || [])
        .map((c) => c.propertyName)
        .filter(Boolean);
      if (cols.length > 0) {
        uniques.push(cols);
      }
    }
  });
  return uniques;
}

export async function findUniqueEntry<Entity>(
  repository: { metadata: EntityMetadata; findOne: (options: any) => Promise<any> },
  entity: Record<string, any>,
): Promise<any> {
  const uniqueGroups = getUniqueColumns(repository.metadata);
  if (uniqueGroups.length === 0) {
    return null;
  }

  for (const cols of uniqueGroups) {
    const hasAll = cols.every(
      (field) => entity[field] !== undefined && entity[field] !== null,
    );
    if (!hasAll) continue;

    const where = cols.reduce(
      (acc, field) => ({ ...acc, [field]: entity[field] }),
      {},
    );
    const result = await repository.findOne({
      select: { id: true } as any,
      where: where as any,
    });
    if (result) return result;
  }

  return null;
}
