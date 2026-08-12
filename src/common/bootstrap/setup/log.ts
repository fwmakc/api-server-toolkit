import { Logger } from '@nestjs/common';

export const Log = {
  setup(app: any, opts?: { serviceName?: string }): void {
    const logger = new Logger(opts?.serviceName || 'Bootstrap');
    app.useLogger(['error', 'warn', 'log']);
  },
};
