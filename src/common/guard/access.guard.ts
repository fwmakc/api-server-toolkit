import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessRule, matchRule } from '../access.rules';
import { isSuperuser } from '../service/admin.service';

export const ACCESS_RULES_METADATA = 'access-rules';

/**
 * Проверяет совпадение правил операции по ролям (who).
 * Суперюзер проходит всегда. Совпавшее правило кладётся в request.accessRule.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rules = this.reflector.get<AccessRule[]>(
      ACCESS_RULES_METADATA,
      context.getHandler(),
    );

    if (!rules?.length) return true;

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (isSuperuser(user)) {
      request.accessRule = undefined;
      return true;
    }

    const matched = matchRule(rules, user);
    if (!matched) {
      throw new ForbiddenException('Access denied');
    }

    request.accessRule = matched;
    return true;
  }
}
