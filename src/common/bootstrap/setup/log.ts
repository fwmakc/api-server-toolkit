import { Logger } from '@nestjs/common';
import { JsonLogger, requestContextMiddleware } from '../../logger';

export const Log = {
  setup(app: any, opts?: { serviceName?: string }): void {
    if (process.env.LOG_FORMAT === 'json') {
      app.use(requestContextMiddleware);
      app.useLogger(new JsonLogger());
    } else {
      new Logger(opts?.serviceName || 'Bootstrap');
      app.useLogger(['error', 'warn', 'log']);
    }
  },
};
