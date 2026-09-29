import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';

export interface BootstrapOptions {
  port?: number | string;
  ip?: string;
}

export async function bootstrap(
  app: NestExpressApplication,
  options?: BootstrapOptions,
): Promise<void> {
  const {
    port = process.env.PORT,
    // Bind all interfaces: in containers the service must be reachable
    // cross-container (nginx, webhooks). Pass a narrower ip explicitly
    // for host-only setups.
    ip = '0.0.0.0',
  } = options || {};

  const logger = new Logger('Bootstrap');

  await app.listen(port as number, ip as string);
  logger.log(
    `Application running in ${process.env.NODE_ENV || 'development'} mode on port ${port} at http://${ip}:${port}`,
  );

  process.on('SIGINT', () => {
    app.close();
  });
}
