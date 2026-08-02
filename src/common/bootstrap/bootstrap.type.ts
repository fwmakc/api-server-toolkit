import { Type } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

export interface BootstrapOptions {
  module: Type<unknown>;

  serviceName: string;

  port?: number | string;

  ip?: string;

  cors?: boolean | Record<string, unknown>;

  swagger?: boolean;

  morgan?: boolean;

  cookieParser?: boolean;

  passport?: boolean;

  transactional?: boolean;

  beforeListen?: (
    app: NestExpressApplication,
  ) => void | Promise<void>;
}
