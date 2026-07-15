import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class SimpleSecureGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
