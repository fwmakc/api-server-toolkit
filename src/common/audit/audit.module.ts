import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';

export interface AuditModuleOptions {
  /** Audit successful mutations (non-GET 2xx) through a global interceptor.
   * Turn off for services whose mutations are fully covered by explicit
   * audit calls (e.g. auth-server). Default: true. */
  mutations?: boolean;
}

/** Global so AccessGuard can inject AuditService from any module context. */
@Global()
@Module({})
export class AuditModule {
  static forRoot(options: AuditModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [AuditService];
    if (options.mutations !== false) {
      providers.push({ provide: APP_INTERCEPTOR, useClass: AuditInterceptor });
    }
    return {
      module: AuditModule,
      providers,
      exports: [AuditService],
    };
  }
}
