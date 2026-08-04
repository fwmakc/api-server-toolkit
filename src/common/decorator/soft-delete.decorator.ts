export const SOFT_DELETE_METADATA = 'softDelete';

export function SoftDelete(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(SOFT_DELETE_METADATA, propertyKey, target.constructor);
  };
}
