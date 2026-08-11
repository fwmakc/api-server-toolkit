import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { removePrivateFields } from '../service/private_fields.service';
import { isSuperuser } from '../service/admin.service';
import { OWNER_TABLE } from '../service/owner.service';
import { TENANT_TABLE, TENANT_FIELD } from '../service/tenant.service';

@Injectable()
export class RemovePrivateFieldsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const bind: any = {
      allow: isSuperuser(user),
      id: user?.id,
      key: 'id',
      name: OWNER_TABLE,
    };

    if (TENANT_TABLE) {
      bind.tenantId = user?.tenantId;
      bind.tenantKey = TENANT_FIELD;
      bind.tenantName = TENANT_TABLE;
    }

    return next
      .handle()
      .pipe(map((result) => {
        if (result === null || result === undefined || typeof result !== 'object') {
          return result;
        }
        return removePrivateFields(result, bind, user);
      }));
  }
}
