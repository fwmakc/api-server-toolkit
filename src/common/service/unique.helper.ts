import { EntityMetadata, IsNull } from 'typeorm';
import { BindDto } from '../dto/bind.dto';

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

export async function findUniqueEntry<_Entity>(
  repository: { metadata: EntityMetadata; findOne: (options: any) => Promise<any> },
  entity: Record<string, any>,
  bind?: BindDto,
  softDeleteCol?: string | null,
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

    const where: Record<string, any> = cols.reduce(
      (acc, field) => ({ ...acc, [field]: entity[field] }),
      {},
    );
    // проба должна видеть те же строки, что и последующий update/create:
    // иначе чужая/мягко-удалённая строка навсегда блокирует значение
    if (softDeleteCol) where[softDeleteCol] = IsNull();
    if (bind?.id !== undefined && !bind.allow) {
      if (bind.name) where[bind.name] = { [bind.key || 'id']: bind.id };
      else where.id = bind.id;
    }
    if (bind?.tenantId !== undefined && bind.tenantName && !bind.allow) {
      where[bind.tenantName] = { [bind.tenantKey || 'id']: bind.tenantId };
    }
    const result = await repository.findOne({
      select: { id: true } as any,
      where: where as any,
    });
    if (result) return result;
  }

  return null;
}
