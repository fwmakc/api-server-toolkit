import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DeepPartial } from 'typeorm';

export function DtoEnumColumn(
  description,
  value,
  defaultValue = null,
  options = undefined,
): PropertyDecorator {
  const { required = false } = options || {};

  return function (object: object, propertyName: string | symbol) {
    const properties: DeepPartial<any> = {
      description,
      required,
      enum: value,
    };

    if (defaultValue !== undefined) {
      properties.default = defaultValue;
    }

    ApiProperty(properties)(object, propertyName);
    IsOptional()(object, propertyName);
    IsEnum(value)(object, propertyName);
  };
}
