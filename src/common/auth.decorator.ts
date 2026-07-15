import {
  UseGuards,
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountLike } from './access.type';
import { ApiType } from './type/api.type';

class JwtAccountGuard extends AuthGuard('jwt') {}

class JwtNoBlockAccountGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user;
  }
}

export const Account = (apiType: ApiType = undefined) => {
  if (apiType === 'noBlock') {
    return applyDecorators(UseGuards(JwtNoBlockAccountGuard));
  }
  return applyDecorators(UseGuards(JwtAccountGuard));
};

export const Self = createParamDecorator(
  async (apiType: ApiType = undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    if (apiType !== 'noBlock') {
      if (!user || user?.id === undefined) {
        throw new ForbiddenException('You have no rights!');
      }
    }
    return user as AccountLike;
  },
);
