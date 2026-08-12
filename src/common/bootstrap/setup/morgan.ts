export const Morgan = {
  setup(app: any, opts?: { format?: string }): void {
    const morgan = require('morgan');
    const format = opts?.format || process.env.MORGAN_LOG_FORMAT || 'dev';
    if (format === 'json') {
      app.use(morgan('json', (tokens: any, req: any, res: any) =>
        JSON.stringify({
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          status: Number(tokens.status(req, res)),
          responseTime: Number(tokens['response-time'](req, res)),
          contentLength: tokens.res(req, res, 'content-length'),
          userAgent: req.headers['user-agent'],
          remoteAddr: tokens['remote-addr'](req, res),
          timestamp: new Date().toISOString(),
        }),
      ));
    } else {
      app.use(morgan(format));
    }
  },
};
