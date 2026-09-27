import { Logger } from '@nestjs/common';

export const Log = {
  setup(app: any, opts?: { serviceName?: string }): void {
    new Logger(opts?.serviceName || 'Bootstrap');
    app.useLogger(['error', 'warn', 'log']);
  },
};
