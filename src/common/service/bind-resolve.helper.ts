import { NotFoundException } from '@nestjs/common';
import { EntityManager, EntityMetadata } from 'typeorm';
import { BindDto } from '../dto/bind.dto';
import { OWNER_TABLE } from './owner.service';

export async function resolveBindRelationId(
  metadata: EntityMetadata,
  bind: BindDto,
  manager: EntityManager,
): Promise<number | string | null> {
  const key = bind.key || 'id';
  if (key === 'id') {
    return bind.id;
  }
  const name = bind.name || OWNER_TABLE;
  const segments = name.split('.');
  let currentMetadata = metadata;
  for (const segment of segments) {
    const relation = currentMetadata.relations.find(
      (r) => r.propertyName === segment,
    );
    if (!relation) {
      return null;
    }
    currentMetadata = relation.inverseEntityMetadata;
  }
  const relatedRepo = manager.getRepository(currentMetadata.target);
  const related = await relatedRepo.findOne({
    where: { [key]: bind.id } as any,
  });
  return related ? related.id : null;
}

export async function resolveAutoAssign(
  metadata: EntityMetadata,
  bind: BindDto,
  manager: EntityManager,
): Promise<{ name: string; id: number | string } | null> {
  if (bind.id === undefined) return null;

  const name = bind.name || OWNER_TABLE;
  const segments = name.split('.');

  if (segments.length === 1) {
    const resolvedId = await resolveBindRelationId(metadata, bind, manager);
    return resolvedId !== null
      ? { name: segments[0], id: resolvedId }
      : null;
  }

  const firstSegment = segments[0];
  const relation = metadata.relations.find(
    (r) => r.propertyName === firstSegment,
  );
  if (!relation) return null;

  if (
    relation.relationType !== 'many-to-one' &&
    relation.relationType !== 'one-to-one'
  ) {
    return null;
  }

  const key = bind.key || 'id';
  let nestedWhere: Record<string, unknown> = { [key]: bind.id };
  for (let i = segments.length - 1; i > 0; i--) {
    nestedWhere = { [segments[i]]: nestedWhere };
  }

  const firstRepo = manager.getRepository(
    relation.inverseEntityMetadata.target,
  );

  const result = await firstRepo.findOne({
    where: nestedWhere,
    select: { id: true } as any,
  });

  if (!result) {
    throw new NotFoundException(
      `Entity not found for auto-assign path: ${firstSegment}`,
    );
  }

  return { name: firstSegment, id: result.id };
}
