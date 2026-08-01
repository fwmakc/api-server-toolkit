import { ApiProperty } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';
import { DeepPartial } from 'typeorm';

export function DtoJsonColumn(
  description,
  options = undefined,
): PropertyDecorator {
  const { required = false } = options || {};

  return function (object: object, propertyName: string | symbol) {
    const properties: DeepPartial<any> = {
      description,
      required,
    };

    ApiProperty(properties)(object, propertyName);
    IsJSON()(object, propertyName);
    IsOptional()(object, propertyName);
  };
}
