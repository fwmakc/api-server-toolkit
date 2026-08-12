import * as SentrySdk from '@sentry/nestjs';

export const Sentry = {
  setup(app: any, opts?: { dsn?: string; environment?: string }): void {
    SentrySdk.init({
      dsn: opts?.dsn || process.env.SENTRY_DSN,
      environment: opts?.environment || process.env.SENTRY_ENV || 'localhost',
    });
  },
};
