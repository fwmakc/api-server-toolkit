import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import helmet from 'helmet';
import { BootstrapOptions } from './bootstrap.type';

const STANDARD_CORS = {
  allowedHeaders: [
    'Content-Type',
    'Vary',
    'Accept',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
    'Authorization',
    'X-Requested-With',
  ],
  exposedHeaders: [
    'Content-Type',
    'Vary',
    'Accept',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
    'Authorization',
    'X-Requested-With',
  ],
  origin: true,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export async function bootstrap(
  options: BootstrapOptions,
): Promise<void> {
  const {
    module,
    serviceName,
    port = process.env.PORT,
    ip = process.env.IP || 'localhost',
    cors = true,
    swagger = true,
    morgan: enableMorgan = true,
    cookieParser: enableCookieParser = false,
    passport: enablePassport = false,
    transactional = false,
    beforeListen,
  } = options;

  if (transactional) {
    const { initializeTransactionalContext } = require('typeorm-transactional');
    initializeTransactionalContext();
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV || 'localhost',
  });

  const nestOptions: Record<string, unknown> = {
    logger: ['error', 'warn', 'log'],
  };

  if (cors) {
    nestOptions.cors = cors === true ? STANDARD_CORS : cors;
  }

  const app =
    await NestFactory.create<NestExpressApplication>(module, nestOptions);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (enableMorgan && process.env.MORGAN_LOG_FORMAT) {
    const morgan = require('morgan');
    app.use(morgan(process.env.MORGAN_LOG_FORMAT));
  }

  if (process.env.PREFIX) {
    app.setGlobalPrefix(process.env.PREFIX);
  }

  if (swagger && process.env.SWAGGER_PREFIX) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || '')
      .setDescription(process.env.SWAGGER_DESCRIPTION || '')
      .setVersion(process.env.SWAGGER_VERSION || '')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(process.env.SWAGGER_PREFIX, app, swaggerDocument);
  }

  if (swagger && process.env.SWAGGER_PREFIX_REDOC) {
    const redoc = require('redoc-express');
    const redocConfig = {
      title: process.env.SWAGGER_TITLE || '',
      version: process.env.SWAGGER_VERSION || '',
      specUrl: `${process.env.SWAGGER_PREFIX}-json`,
    };
    app.use(process.env.SWAGGER_PREFIX_REDOC, redoc(redocConfig));
  }

  if (enableCookieParser) {
    const cookieParser = require('cookie-parser');
    app.use(cookieParser());
  }

  if (enablePassport) {
    const passport = require('passport');
    app.use(passport.initialize());
  }

  if (beforeListen) {
    await beforeListen(app);
  }

  const logger = new Logger('Bootstrap');

  await app.listen(port as number, ip as string);
  logger.log(
    `${serviceName} running in ${process.env.NODE_ENV || 'development'} mode on port ${port} at http://${ip}:${port}`,
  );

  process.on('SIGINT', () => {
    app.close();
  });
}
