import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { getClientIp } from '../helper/ip.helper';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AccountInfo } from '../access.type';
import { AuditEntry, AuditService } from './audit.service';

const AUDITED_ACTIONS: Record<string, AuditEntry['action']> = {
  POST: 'data.created',
  PUT: 'data.updated',
  PATCH: 'data.updated',
  DELETE: 'data.deleted',
};

/**
 * Audits every successful mutating request (non-GET 2xx) at the HTTP layer,
 * so EntityController CRUD and custom handlers are covered uniformly.
 * Failed mutations are audited separately: guard denials via AccessGuard,
 * handler errors stay in the structured logs.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const action = AUDITED_ACTIONS[request.method];
    if (!action) return next.handle();

    return next.handle().pipe(
      tap((data) => {
        const response = http.getResponse();
        if (response.statusCode >= 400) return;

        const account = (request.user ?? undefined) as AccountInfo | undefined;
        const resource =
          data && typeof data === 'object' && 'id' in (data as object)
            ? String((data as Record<string, unknown>).id)
            : undefined;

        this.audit.log({
          action,
          outcome: 'success',
          accountId: account?.id,
          accountUsername: account?.username,
          tenantId: account?.tenantId,
          ip: getClientIp(request),
          userAgent: request.headers?.['user-agent'],
          targetType: 'route',
          targetId: request.route?.path ?? request.url,
          details: {
            method: request.method,
            status: response.statusCode,
            ...(resource ? { resourceId: resource } : {}),
          },
        });
      }),
    );
  }
}
