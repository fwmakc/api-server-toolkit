import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import {
  AccessRule,
  isPublicRules,
} from '../access.rules';
import { ACCESS_RULES_METADATA, AccessGuard } from '../guard/access.guard';
import { JwtPublicGuard, JwtRequiredGuard } from '../auth.decorator';

/**
 * Декораторы доступа для маршрута: выбор JWT-guard'а (публичный/обязательный)
 * + AccessGuard с правилами. Общий механизм для @Access и EntityController.
 */
export function accessDecorators(rules: AccessRule[]): MethodDecorator[] {
  const decs: MethodDecorator[] = [];

  if (isPublicRules(rules)) {
    decs.push(UseGuards(JwtPublicGuard));
  } else {
    decs.push(UseGuards(JwtRequiredGuard));
  }
  decs.push(UseGuards(AccessGuard));
  decs.push(SetMetadata(ACCESS_RULES_METADATA, rules));

  return decs;
}

/**
 * Доступ к кастомному (не EntityController) маршруту через список правил.
 *
 * @Access([{ who: ['authenticated'], scope: { owner: 'account.id' } }])
 * @Access([{ who: ['moderator'] }])
 */
export const Access = (rules: AccessRule[]) => {
  return applyDecorators(...accessDecorators(rules));
};
