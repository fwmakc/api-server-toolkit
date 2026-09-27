import 'reflect-metadata';

jest.mock('@nestjs/swagger', () => ({
  SwaggerModule: {
    createDocument: jest.fn().mockReturnValue({}),
    setup: jest.fn(),
  },
  DocumentBuilder: jest.fn().mockReturnValue({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  }),
}));

jest.mock('@nestjs/common', () => ({
  ValidationPipe: jest.fn(),
  Logger: jest.fn().mockReturnValue({}),
}));

const { Helmet, Morgan, Cors, CookieParser, Passport, Swagger, ValidationPipe, Log, Prefix, Sentry, Telemetry } = require('../common/bootstrap/setup/index');

const createMockApp = () => ({
  use: jest.fn(),
  useGlobalPipes: jest.fn(),
  setGlobalPrefix: jest.fn(),
  useLogger: jest.fn(),
});

describe('bootstrap setup utilities', () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
    jest.clearAllMocks();
  });

  describe('Helmet', () => {
    it('calls app.use once with result of helmet()', () => {
      Helmet.setup(app);
      expect(app.use).toHaveBeenCalledTimes(1);
    });

    it('passes opts to helmet', () => {
      const opts = { contentSecurityPolicy: false };
      Helmet.setup(app, opts);
      expect(app.use).toHaveBeenCalledTimes(1);
    });
  });

  describe('Morgan', () => {
    it('calls app.use once', () => {
      Morgan.setup(app);
      expect(app.use).toHaveBeenCalledTimes(1);
    });

    it('calls app.use once when format=json', () => {
      Morgan.setup(app, { format: 'json' });
      expect(app.use).toHaveBeenCalledTimes(1);
    });

    it('calls morgan with dev format by default', () => {
      const origFormat = process.env.MORGAN_LOG_FORMAT;
      delete process.env.MORGAN_LOG_FORMAT;
      Morgan.setup(app);
      const morgan = require('morgan');
      expect(morgan).toHaveBeenCalledWith('dev');
      process.env.MORGAN_LOG_FORMAT = origFormat;
    });

    it('calls morgan with json format when format=json', () => {
      Morgan.setup(app, { format: 'json' });
      const morgan = require('morgan');
      expect(morgan).toHaveBeenCalledWith('json', expect.any(Function));
    });

    it('uses MORGAN_LOG_FORMAT env when no opts', () => {
      const origFormat = process.env.MORGAN_LOG_FORMAT;
      process.env.MORGAN_LOG_FORMAT = 'combined';
      Morgan.setup(app);
      const morgan = require('morgan');
      expect(morgan).toHaveBeenCalledWith('combined');
      process.env.MORGAN_LOG_FORMAT = origFormat;
    });
  });

  describe('Cors', () => {
    const makeRes = () => {
      const headers: Record<string, any> = {};
      return {
        headers,
        statusCode: 0,
        header(k: string, v: any) {
          headers[k] = v;
        },
      };
    };

    const run = (mw: any, origin?: string, method = 'GET') => {
      const res = makeRes();
      mw({ method, headers: origin ? { origin } : {} }, res, () => {});
      return res;
    };

    it('calls app.use by default', () => {
      Cors.setup(app);
      expect(app.use).toHaveBeenCalledTimes(1);
    });

    it('does NOT call app.use when opts=false', () => {
      Cors.setup(app, false);
      expect(app.use).not.toHaveBeenCalled();
    });

    it('reflects exactly the allowed origin with credentials', () => {
      Cors.setup(app, { origins: ['https://app.example.com'] });
      const res = run(app.use.mock.calls[0][0], 'https://app.example.com');
      expect(res.headers['Access-Control-Allow-Origin']).toBe('https://app.example.com');
      expect(res.headers['Access-Control-Allow-Credentials']).toBe('true');
      expect(res.headers['Vary']).toBe('Origin');
    });

    it('sends no CORS headers for an origin outside the allowlist', () => {
      Cors.setup(app, { origins: ['https://app.example.com'] });
      const res = run(app.use.mock.calls[0][0], 'https://evil.example.net');
      expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
      expect(res.headers['Access-Control-Allow-Credentials']).toBeUndefined();
    });

    it('empty allowlist (no CORS_ORIGINS) denies all origins', () => {
      const orig = process.env.CORS_ORIGINS;
      delete process.env.CORS_ORIGINS;
      Cors.setup(app);
      const res = run(app.use.mock.calls[0][0], 'https://app.example.com');
      expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
      process.env.CORS_ORIGINS = orig;
    });

    it('reads CORS_ORIGINS env when no opts', () => {
      const orig = process.env.CORS_ORIGINS;
      process.env.CORS_ORIGINS = 'https://a.com, https://b.com';
      Cors.setup(app);
      const res = run(app.use.mock.calls[0][0], 'https://b.com');
      expect(res.headers['Access-Control-Allow-Origin']).toBe('https://b.com');
      process.env.CORS_ORIGINS = orig;
    });

    it('answers OPTIONS with 204 for allowed origin', () => {
      Cors.setup(app, { origins: ['https://a.com'] });
      const res = run(app.use.mock.calls[0][0], 'https://a.com', 'OPTIONS');
      expect(res.statusCode).toBe(204);
    });
  });

  describe('CookieParser', () => {
    it('calls app.use once', () => {
      CookieParser.setup(app);
      expect(app.use).toHaveBeenCalledTimes(1);
    });
  });

  describe('Passport', () => {
    it('calls app.use once', () => {
      Passport.setup(app);
      expect(app.use).toHaveBeenCalledTimes(1);
    });
  });

  describe('Swagger', () => {
    it('does nothing when SWAGGER_PREFIX not set', () => {
      const origPrefix = process.env.SWAGGER_PREFIX;
      delete process.env.SWAGGER_PREFIX;
      Swagger.setup(app);
      const { SwaggerModule } = require('@nestjs/swagger');
      expect(SwaggerModule.setup).not.toHaveBeenCalled();
      process.env.SWAGGER_PREFIX = origPrefix;
    });

    it('sets up swagger when SWAGGER_PREFIX is set', () => {
      const origPrefix = process.env.SWAGGER_PREFIX;
      process.env.SWAGGER_PREFIX = 'swagger';
      Swagger.setup(app);
      const { SwaggerModule } = require('@nestjs/swagger');
      expect(SwaggerModule.createDocument).toHaveBeenCalled();
      expect(SwaggerModule.setup).toHaveBeenCalledWith('swagger', app, expect.any(Object));
      process.env.SWAGGER_PREFIX = origPrefix;
    });
  });

  describe('ValidationPipe', () => {
    it('calls app.useGlobalPipes once', () => {
      ValidationPipe.setup(app);
      expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);
    });

    it('passes default options', () => {
      const { ValidationPipe: NestValidationPipe } = require('@nestjs/common');
      ValidationPipe.setup(app);
      expect(NestValidationPipe).toHaveBeenCalledWith({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      });
    });

    it('passes custom options', () => {
      const { ValidationPipe: NestValidationPipe } = require('@nestjs/common');
      ValidationPipe.setup(app, { transform: false, whitelist: false, forbidNonWhitelisted: false });
      expect(NestValidationPipe).toHaveBeenCalledWith({
        transform: false,
        whitelist: false,
        forbidNonWhitelisted: false,
      });
    });
  });

  describe('Log', () => {
    it('calls app.useLogger with error, warn, log', () => {
      Log.setup(app);
      expect(app.useLogger).toHaveBeenCalledWith(['error', 'warn', 'log']);
    });
  });

  describe('Prefix', () => {
    it('calls app.setGlobalPrefix when PREFIX env set', () => {
      const origPrefix = process.env.PREFIX;
      process.env.PREFIX = 'api/v1';
      Prefix.setup(app);
      expect(app.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
      process.env.PREFIX = origPrefix;
    });

    it('does nothing when PREFIX env not set', () => {
      const origPrefix = process.env.PREFIX;
      delete process.env.PREFIX;
      Prefix.setup(app);
      expect(app.setGlobalPrefix).not.toHaveBeenCalled();
      process.env.PREFIX = origPrefix;
    });
  });

  describe('Sentry', () => {
    it('calls Sentry.init', () => {
      const sentry = require('@sentry/nestjs');
      Sentry.setup(app);
      expect(sentry.init).toHaveBeenCalledTimes(1);
    });

    it('passes opts dsn and environment', () => {
      const sentry = require('@sentry/nestjs');
      Sentry.setup(app, { dsn: 'https://key@sentry.io/1', environment: 'production' });
      expect(sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ dsn: 'https://key@sentry.io/1', environment: 'production' }),
      );
    });
  });

  describe('Telemetry', () => {
    it('catches error silently when opentelemetry not installed', () => {
      expect(() => Telemetry.setup(app, { serviceName: 'test' })).not.toThrow();
    });
  });
});
