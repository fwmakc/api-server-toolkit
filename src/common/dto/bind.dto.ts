import { ApiProperty } from '@nestjs/swagger';
import { TenantScope } from '../access.type';

export class BindDto {
  @ApiProperty({
    required: false,
    description: 'ID связанной записи',
  })
  id?: number | string;

  @ApiProperty({
    required: false,
    description: 'название связанной таблицы',
  })
  name?: string;

  @ApiProperty({
    required: false,
    description: 'ключ поля ID связанной таблицы',
  })
  key?: string;

  @ApiProperty({
    required: false,
    description:
      'поле управляет отображением защищенных полей: true - разрешить все, false - разрешает отображение защищенных полей только для указанного ID связанной записи',
  })
  allow?: boolean;

  @ApiProperty({
    required: false,
    description: 'ID тенанта (relation path из TENANT_TABLE)',
  })
  tenantId?: number | string;

  @ApiProperty({
    required: false,
    description: 'ключ поля ID тенанта',
  })
  tenantKey?: string;

  @ApiProperty({
    required: false,
    description: 'путь связи к таблице тенанта',
  })
  tenantName?: string;

  @ApiProperty({
    required: false,
    description: 'роли текущего пользователя',
  })
  roles?: string[];

  @ApiProperty({
    required: false,
    enum: ['own', 'all'],
    description: 'tenant scope: own — фильтровать по tenantId, all — видеть все tenant',
  })
  tenantScope?: TenantScope;
}
