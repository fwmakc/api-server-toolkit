import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventClientModule } from '../client/event-client.module';
import { AuditInterceptor } from './audit.interceptor';
import { AUDIT_OPTIONS, AuditFilterOptions, AuditService } from './audit.service';

export interface AuditModuleOptions {
  /** Audit successful mutations (non-GET 2xx) through a global interceptor.
   * Turn off for services whose mutations are fully covered by explicit
   * audit calls (e.g. auth-server). Default: true. */
  mutations?: boolean;
  /** Bind IEventClient by importing EventClientModule here. Without it
   * AuditService cannot see the app-root's EventClientModule (module scopes
   * are not shared) and silently falls back to log lines. Set false only
   * when you pass the client's module yourself via `imports`. Default: true. */
  client?: boolean;
  /** Extra modules made visible to AuditService (e.g. a custom IEventClient
   * provider module when `client: false`). */
  imports?: Array<DynamicModule | Type>;
  /** Source-side volume filter + kill switch (AUDIT_OPTIONS). Unset fields
   * fall back to env: AUDIT_ENABLED / AUDIT_INCLUDE / AUDIT_EXCLUDE.
   * Filtered entries are dropped BEFORE publishing — no bus traffic, no
   * outbox rows, no store growth. Default: everything is recorded. */
  filter?: AuditFilterOptions;
}

/** Global so AccessGuard can inject AuditService from any module context. */
@Global()
@Module({})
export class AuditModule {
  static forRoot(options: AuditModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      AuditService,
      { provide: AUDIT_OPTIONS, useValue: options.filter ?? {} },
    ];
    if (options.mutations !== false) {
      providers.push({ provide: APP_INTERCEPTOR, useClass: AuditInterceptor });
    }
    return {
      module: AuditModule,
      imports: [
        ...(options.client === false ? [] : [EventClientModule]),
        ...(options.imports ?? []),
      ],
      providers,
      exports: [AuditService],
    };
  }
}
