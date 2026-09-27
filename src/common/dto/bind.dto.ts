import { ApiProperty } from '@nestjs/swagger';

/**
 * Внутренний мост между моделью доступа (AccessRule) и query-хелперами.
 * Строится compileRuleToBind из совпавшего правила.
 */
export class BindDto {
  @ApiProperty({
    required: false,
    description: 'ID связанной записи (владелец)',
  })
  id?: number | string;

  @ApiProperty({
    required: false,
    description: 'путь связи до владельца (multi-hop через точку)',
  })
  name?: string;

  @ApiProperty({
    required: false,
    description: 'ключ поля ID связанной таблицы',
  })
  key?: string;

  @ApiProperty({
    required: false,
    description: 'true — без строчных фильтров (суперюзер)',
  })
  allow?: boolean;

  @ApiProperty({
    required: false,
    description: 'ID тенанта',
  })
  tenantId?: number | string;

  @ApiProperty({
    required: false,
    description: 'ключ поля ID тенанта',
  })
  tenantKey?: string;

  @ApiProperty({
    required: false,
    description: 'путь связи до тенанта',
  })
  tenantName?: string;

  @ApiProperty({
    required: false,
    description: 'роли текущего пользователя',
  })
  roles?: string[];

  @ApiProperty({
    required: false,
    description: 'форс-условия поверх пользовательского where (фильтр сильнее)',
  })
  filter?: Record<string, unknown>;
}
