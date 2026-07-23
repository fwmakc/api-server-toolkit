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
  AccountLike,
  normalizeAccess,
  OperationAccess,
} from './access.type';

class JwtPublicGuard extends AuthGuard('jwt') {
  handleRequest(_: any, user: any) {
    return user;
  }
}

class JwtRequiredGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new UnauthorizedException();
    return user;
  }
}

class JwtAdminGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new UnauthorizedException();
    if (!user.isSuperuser) {
      throw new ForbiddenException('You have no rights!');
    }
    return user;
  }
}

export function accessGuard(access: OperationAccess) {
  const level = normalizeAccess(access);
  if (level === 'public') return UseGuards(JwtPublicGuard);
  if (level === 'admin') return UseGuards(JwtAdminGuard);
  return UseGuards(JwtRequiredGuard);
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
    return context.switchToHttp().getRequest()?.user as AccountLike;
  },
);
