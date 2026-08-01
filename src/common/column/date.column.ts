import { Column } from 'typeorm';
import { IndexedColumn } from './indexed.column';

export function DateColumn(name, options = undefined): PropertyDecorator {
  const { comment = undefined, index = undefined } = options || {};

  return function (object: object, propertyName: string | symbol) {
    if (index) {
      IndexedColumn(index)(object, propertyName);
    }

    Column({
      comment,
      name,
      nullable: true,
      type: 'timestamp',
    })(object, propertyName);
  };
}
