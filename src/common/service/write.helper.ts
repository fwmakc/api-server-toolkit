import { DeepPartial, EntityManager } from 'typeorm';
import { sanitizeForSave } from './sanitize.service';
import { BindDto } from '../dto/bind.dto';

export async function prepareAndCreate(
  entity: DeepPartial<any>,
  entityTarget: any,
  bind: BindDto,
  manager: EntityManager,
): Promise<any> {
  if (bind.id !== undefined && !bind.allow) {
    const { resolveAutoAssign } = await import('./bind-resolve.helper');
    const metadata = manager.getRepository(entityTarget).metadata;
    const autoAssign = await resolveAutoAssign(metadata, bind, manager);
    if (autoAssign) {
      entity[autoAssign.name] = { id: autoAssign.id };
    }
  }

  if (
    bind.tenantId !== undefined &&
    !bind.allow &&
    bind.tenantName &&
    !bind.tenantName.includes('.')
  ) {
    entity[bind.tenantName] = { id: bind.tenantId };
  }

  await sanitizeForSave(entity, manager.getRepository(entityTarget).metadata, bind, manager);
  return manager.getRepository(entityTarget).save(entity);
}

export async function prepareAndUpdate(
  entity: DeepPartial<any>,
  entityTarget: any,
  bind: BindDto,
  manager: EntityManager,
): Promise<void> {
  await sanitizeForSave(entity, manager.getRepository(entityTarget).metadata, bind, manager);
  await manager.getRepository(entityTarget).save(entity);
}
