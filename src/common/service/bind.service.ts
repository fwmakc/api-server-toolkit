import { BindDto } from '../dto/bind.dto';
import { OWNER_TABLE } from './owner.service';
import { TENANT_TABLE, TENANT_FIELD } from './tenant.service';

export function bind(
  entrie: any,
  options: BindDto,
): BindDto {
  const { allow, key, name } = options;
  const result: BindDto = {
    allow,
    id: entrie?.[key || 'id'],
    key: key || 'id',
    name: name || OWNER_TABLE,
  };

  const tName = options.tenantName || TENANT_TABLE;
  if (tName) {
    result.tenantId = options.tenantId ?? entrie?.tenantId;
    result.tenantKey = options.tenantKey || TENANT_FIELD;
    result.tenantName = tName;
  }

  return result;
}
