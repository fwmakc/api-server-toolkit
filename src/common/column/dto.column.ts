import { ApiProperty } from '@nestjs/swagger';
import { DeepPartial } from 'typeorm';

export function DtoColumn(
  description = '',
  options = undefined,
): PropertyDecorator {
  const { required = false, defaultValue = undefined } = options || {};

  return function (object: object, propertyName: string | symbol) {
    const properties: DeepPartial<any> = {
      description,
      required,
    };

    if (defaultValue !== undefined) {
      properties.default = defaultValue;
    }

    ApiProperty(properties)(object, propertyName);
  };
}
