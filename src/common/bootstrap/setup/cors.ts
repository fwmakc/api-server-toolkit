const STANDARD_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
const STANDARD_HEADERS = [
  'Content-Type', 'Vary', 'Accept', 'Access-Control-Allow-Headers',
  'Access-Control-Allow-Origin', 'Authorization', 'X-Requested-With',
];

export interface CorsSetupOptions {
  /** Разрешённые Origin. По умолчанию — env CORS_ORIGINS (список через запятую). */
  origins?: string[];
  /** Отправлять ли Access-Control-Allow-Credentials. По умолчанию true. */
  credentials?: boolean;
}

/**
 * CORS c allowlist. Разрешённому Origin ответ отражается точно этим Origin
 * (требование браузеров при credentials). Origin вне списка и запросы без
 * Origin CORS-заголовков не получают. Пустой allowlist = CORS выключен.
 */
export const Cors = {
  setup(app: any, opts?: boolean | CorsSetupOptions): void {
    if (opts === false) return;
    const config: CorsSetupOptions = opts === true || opts === undefined ? {} : opts;
    const origins =
      config.origins ??
      (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const credentials = config.credentials ?? true;

    app.use((req: any, res: any, next: () => void) => {
      const origin = req.headers.origin;
      if (origin && origins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Credentials', String(credentials));
        res.header('Access-Control-Allow-Methods', STANDARD_METHODS);
        res.header('Access-Control-Allow-Headers', STANDARD_HEADERS.join(','));
        res.header('Access-Control-Expose-Headers', STANDARD_HEADERS.join(','));
        if (req.method === 'OPTIONS') res.statusCode = 204;
      }
      next();
    });
  },
};
