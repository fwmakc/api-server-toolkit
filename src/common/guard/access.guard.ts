import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getClientIp } from '../helper/ip.helper';
import { AccessRule, matchRule } from '../access.rules';
import { AuditService } from '../audit/audit.service';
import { isSuperuser } from '../service/admin.service';

export const ACCESS_RULES_METADATA = 'access-rules';

/**
 * Проверяет совпадение правил операции по ролям (who).
 * Суперюзер проходит всегда. Совпавшее правило кладётся в request.accessRule.
 * Отказ (403) публикуется в аудит, если AuditService доступен.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly audit?: AuditService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const rules = this.reflector.get<AccessRule[]>(
      ACCESS_RULES_METADATA,
      context.getHandler(),
    );

    // metadata === undefined: маршрут без @Access — гард не управляет им
    // (глобальное монтирование не должно ломать остальные маршруты).
    // Явный пустой массив — deny: пропустить его значило бы отдать хендлер
    // с accessBind-байпасом (CommonService трактует undefined-бинд как allow).
    if (rules === undefined) return true;

    const request = context.switchToHttp().getRequest();

    if (rules.length === 0) {
      this.audit?.log({
        action: 'access.denied',
        outcome: 'deny',
        accountId: request?.user?.id,
        targetType: 'route',
        targetId: request?.route?.path ?? request?.url,
        details: { reason: 'empty rules' },
      });
      throw new ForbiddenException('Access denied');
    }
    const { user } = request;

    if (isSuperuser(user)) {
      request.accessRule = undefined;
      return true;
    }

    const matched = matchRule(rules, user);
    if (!matched) {
      this.audit?.log({
        action: 'access.denied',
        outcome: 'deny',
        accountId: user?.id,
        accountUsername: user?.username,
        tenantId: user?.tenantId,
        ip: getClientIp(request),
        userAgent: request.headers?.['user-agent'],
        targetType: 'route',
        targetId: request.route?.path ?? request.url,
        details: { method: request.method, roles: user?.roles ?? ['public'] },
      });
      throw new ForbiddenException('Access denied');
    }

    request.accessRule = matched;
    return true;
  }
}
