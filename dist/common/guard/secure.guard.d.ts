import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class SecureGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
