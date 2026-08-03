import { BindDto } from '../dto/bind.dto';
import { OWNER_TABLE } from './owner.service';

export function bind(entrie, { allow, key, name }: BindDto): BindDto {
  const bind = {
    allow,
    id: entrie?.[key || 'id'],
    key: key || 'id',
    name: name || OWNER_TABLE,
  };
  return bind;
}
