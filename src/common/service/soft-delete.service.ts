import { SOFT_DELETE_METADATA } from '../decorator/soft-delete.decorator';

export function getSoftDeleteColumn(entityTarget: any): string | undefined {
  if (!entityTarget) return undefined;
  const col = Reflect.getMetadata(SOFT_DELETE_METADATA, entityTarget);
  return typeof col === 'string' ? col : undefined;
}
