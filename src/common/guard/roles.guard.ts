import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { isSuperuser } from "../service/admin.service";

export const ROLES_METADATA = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_METADATA,
      context.getHandler(),
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    if (isSuperuser(user)) {
      return true;
    }

    const userRoles: string[] = user.roles || [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException("Insufficient role permissions");
    }

    return true;
  }
}
