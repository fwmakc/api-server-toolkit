import { PrimaryGeneratedColumn } from 'typeorm';

type IdTypes = 'int' | 'bigint';

export function IdColumn(
  type: IdTypes = 'bigint',
  comment = undefined,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    PrimaryGeneratedColumn({
      comment,
      name: 'id',
      type,
      unsigned: true,
    })(object, propertyName);
  };
}
