import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { removePrivateFields } from '../service/private_fields.service';

/**
 * Глобальный интерсептор: вырезает поля ответа, не прошедшие
 * fields[].response правила (PermissionRegistry по классу сущности).
 */
@Injectable()
export class RemovePrivateFieldsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const account = context.switchToHttp().getRequest()?.user;

    return next
      .handle()
      .pipe(map((result) => {
        if (result === null || result === undefined || typeof result !== 'object') {
          return result;
        }
        return removePrivateFields(result, account);
      }));
  }
}
