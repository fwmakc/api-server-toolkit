import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';

export interface BootstrapOptions {
  port?: number | string;
  ip?: string;
  /** Express `trust proxy` value. Default: TRUST_PROXY env or 1 (one proxy
   * hop — the gateway nginx). req.ip then resolves to the real client IP
   * (rightmost X-Forwarded-For entry appended by nginx), which feeds the
   * throttler and audit records. Set 0/false for direct exposure. */
  trustProxy?: boolean | number | string;
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
    trustProxy = process.env.TRUST_PROXY ?? 1,
  } = options || {};

  const raw = String(trustProxy);
  const proxyValue: boolean | number | string =
    raw === 'true' ? true : raw === 'false' ? false : /^\d+$/.test(raw) ? Number(raw) : raw;
  app.set('trust proxy', proxyValue);

  const logger = new Logger('Bootstrap');

  await app.listen(port as number, ip as string);
  logger.log(
    `Application running in ${process.env.NODE_ENV || 'development'} mode on port ${port} at http://${ip}:${port}`,
  );

  process.on('SIGINT', () => {
    app.close();
  });
}
