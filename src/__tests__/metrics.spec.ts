import { of, throwError } from 'rxjs';
import { MetricsController } from '../common/metrics/metrics.controller';
import { MetricsInterceptor } from '../common/metrics/metrics.interceptor';
import {
  MetricsModuleOptions,
  MetricsService,
} from '../common/metrics/metrics.service';

const options: MetricsModuleOptions = { service: 'test-service' };

describe('MetricsService', () => {
  it('exposes default Node.js metrics and the service label', async () => {
    const service = new MetricsService(options);
    const text = await service.getMetrics();
    expect(text).toContain('process_cpu_seconds_total');
    expect(text).toContain('service="test-service"');
  });

  it('accepts extra default labels', async () => {
    const service = new MetricsService({
      service: 'test-service',
      defaultLabels: { env: 'ci' },
    });
    const text = await service.getMetrics();
    expect(text).toContain('env="ci"');
  });

  it('observes HTTP requests as counter + histogram', async () => {
    const service = new MetricsService(options);
    service.observeHttp('GET', '/users/:id', 200, 0.042);
    service.observeHttp('GET', '/users/:id', 200, 0.042);
    service.observeHttp('POST', '/users', 201, 0.1);

    const text = await service.getMetrics();
    expect(text).toContain('http_requests_total{method="GET",route="/users/:id",status="200",service="test-service"} 2');
    expect(text).toContain('http_requests_total{method="POST",route="/users",status="201",service="test-service"} 1');
    expect(text).toContain('http_request_duration_seconds_count{service="test-service",method="GET",route="/users/:id",status="200"} 2');
  });

  it('creates custom counters, gauges and histograms', async () => {
    const service = new MetricsService(options);
    const jobs = service.counter('test_jobs_total', 'Jobs processed', ['kind']);
    jobs.inc({ kind: 'mail' }, 3);

    const depth = service.gauge('test_queue_depth', 'Queue depth');
    depth.set(7);

    const sizes = service.histogram('test_payload_size', 'Payload size');
    sizes.observe(123);

    const text = await service.getMetrics();
    expect(text).toContain('test_jobs_total{kind="mail",service="test-service"} 3');
    expect(text).toContain('test_queue_depth{service="test-service"} 7');
    expect(text).toContain('test_payload_size_count{service="test-service"} 1');
  });

  it('publishes the standard Prometheus content type', () => {
    const service = new MetricsService(options);
    expect(service.contentType).toContain('text/plain');
  });
});

describe('MetricsInterceptor', () => {
  const makeContext = (req: Record<string, unknown>, res: Record<string, unknown> = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    }) as any;

  const makeHandler = (result: () => any) => ({ handle: () => result() }) as any;

  it('records successful requests with the route pattern', () => {
    const service = new MetricsService(options);
    const interceptor = new MetricsInterceptor(service);
    const req = { method: 'GET', url: '/users/42?full=1', originalUrl: '/users/42', baseUrl: '', route: { path: '/users/:id' } };
    const res = { statusCode: 200 };

    interceptor.intercept(makeContext(req, res), makeHandler(() => of('ok'))).subscribe();

    return service.getMetrics().then((text) => {
      expect(text).toContain('http_requests_total{method="GET",route="/users/:id",status="200",service="test-service"} 1');
    });
  });

  it('records error statuses from HttpException-like errors', () => {
    const service = new MetricsService(options);
    const interceptor = new MetricsInterceptor(service);
    const req = { method: 'POST', url: '/users', originalUrl: '/users', baseUrl: '', route: { path: '/users' } };

    const err: any = new Error('forbidden');
    err.getStatus = () => 403;
    interceptor
      .intercept(makeContext(req), makeHandler(() => throwError(() => err)))
      .subscribe({ error: () => {} });

    return service.getMetrics().then((text) => {
      expect(text).toContain('http_requests_total{method="POST",route="/users",status="403",service="test-service"} 1');
    });
  });

  it('labels unmatched routes instead of raw paths', () => {
    const service = new MetricsService(options);
    const interceptor = new MetricsInterceptor(service);
    const req = { method: 'GET', url: '/nowhere', originalUrl: '/nowhere', baseUrl: '', route: undefined };

    interceptor.intercept(makeContext(req, { statusCode: 404 }), makeHandler(() => of(null))).subscribe();

    return service.getMetrics().then((text) => {
      expect(text).toContain('route="unmatched"');
      expect(text).not.toContain('route="/nowhere"');
    });
  });

  it('skips /metrics scrape traffic entirely', () => {
    const service = new MetricsService(options);
    const interceptor = new MetricsInterceptor(service);
    const req = { method: 'GET', url: '/metrics', originalUrl: '/metrics', route: { path: '/metrics' } };

    interceptor.intercept(makeContext(req, { statusCode: 200 }), makeHandler(() => of('data'))).subscribe();

    const spy = jest.spyOn(service, 'observeHttp');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('MetricsController', () => {
  it('returns metrics text with the Prometheus content type', async () => {
    const service = new MetricsService(options);
    const controller = new MetricsController(service);
    const header = jest.fn();
    const send = jest.fn();
    await controller.getMetrics({ header, send } as any);

    expect(header).toHaveBeenCalledWith('Content-Type', service.contentType);
    expect(send).toHaveBeenCalledWith(expect.stringContaining('process_cpu_seconds_total'));
  });
});
