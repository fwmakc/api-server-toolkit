import { NestFactory } from '@nestjs/core';
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
    ip = 'localhost',
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
