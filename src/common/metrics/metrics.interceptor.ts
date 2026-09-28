import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

/**
 * Records method/route-pattern/status/duration for every HTTP request.
 * `/metrics` itself is skipped to keep scrape traffic out of the numbers.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const path: string = (req.originalUrl || req.url || '').split('?')[0];
    if (path === '/metrics') return next.handle();

    const method: string = req.method || 'GET';
    const start = process.hrtime.bigint();

    const record = (status: number) => {
      const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
      const route = `${req.baseUrl || ''}${req.route?.path || 'unmatched'}`;
      this.metrics.observeHttp(method, route, status, durationSec);
    };

    return next.handle().pipe(
      tap({
        next: () => record(http.getResponse().statusCode ?? 200),
        error: (err) => {
          const status =
            err?.getStatus?.() ?? err?.status ?? err?.response?.statusCode ?? 500;
          record(status);
        },
      }),
    );
  }
}
