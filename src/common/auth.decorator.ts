import {
  UseGuards,
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  AccountInfo,
} from './access.type';
import { anonymousAccount, normalizeAccount } from './access.rules';
import { isSuperuser } from './service/admin.service';

/** Публичный маршрут: JWT валидируется, если предъявлен; аноним получает {roles:['public']}. */
export class JwtPublicGuard extends AuthGuard('jwt') {
  handleRequest(_: any, user: any): any {
    return user ? normalizeAccount(user) : anonymousAccount();
  }
}

/** JWT обязателен; вошедшему добавляется псевдо-роль 'authenticated'. */
export class JwtRequiredGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any): any {
    if (err || !user) throw err || new UnauthorizedException();
    return normalizeAccount(user);
  }
}

/** Только суперюзер. */
export class JwtAdminGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any): any {
    if (err || !user) throw err || new UnauthorizedException();
    if (!isSuperuser(user)) {
      throw new ForbiddenException('You have no rights!');
    }
    return normalizeAccount(user);
  }
}

class JwtAccountGuard extends AuthGuard('jwt') {}

export const Account = (apiType?: string) => {
  if (apiType === 'noBlock') {
    return UseGuards(JwtPublicGuard);
  }
  return applyDecorators(UseGuards(JwtAccountGuard));
};

export const Self = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    return context.switchToHttp().getRequest()?.user as AccountInfo;
  },
);
