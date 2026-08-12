const STANDARD_CORS = {
  allowedHeaders: [
    'Content-Type', 'Vary', 'Accept', 'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin', 'Authorization', 'X-Requested-With',
  ],
  exposedHeaders: [
    'Content-Type', 'Vary', 'Accept', 'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin', 'Authorization', 'X-Requested-With',
  ],
  origin: true,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const Cors = {
  setup(app: any, opts?: boolean | Record<string, any>): void {
    if (opts === false) return;
    app.use((_, res, next) => {
      const corsConfig = opts === true || opts === undefined ? STANDARD_CORS : opts;
      res.header('Access-Control-Allow-Origin', corsConfig.origin ? String(corsConfig.origin) : '*');
      res.header('Access-Control-Allow-Methods', corsConfig.methods || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', corsConfig.allowedHeaders?.join(',') || '');
      res.header('Access-Control-Expose-Headers', corsConfig.exposedHeaders?.join(',') || '');
      res.header('Access-Control-Allow-Credentials', corsConfig.credentials ? 'true' : 'false');
      if (_.method === 'OPTIONS' && corsConfig.optionsSuccessStatus) {
        res.statusCode = corsConfig.optionsSuccessStatus;
      }
      next();
    });
  },
};
