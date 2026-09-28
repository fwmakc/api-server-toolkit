import { Inject, Injectable } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

export const METRICS_SERVICE_NAME = 'METRICS_SERVICE_NAME';

export interface MetricsModuleOptions {
  /** Service name — applied as the `service` label to every metric. */
  service: string;
  /** Extra static labels applied to all metrics (optional). */
  defaultLabels?: Record<string, string>;
  /** Scrape interval for Node.js default metrics, ms (default: 10_000). */
  defaultMetricsInterval?: number;
}

/**
 * Prometheus registry per service. Node.js/process default metrics are
 * collected automatically; HTTP traffic is instrumented by MetricsInterceptor.
 * Custom counters/gauges/histograms can be created via counter()/gauge()/histogram().
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  /** Standard Prometheus content type of the /metrics endpoint. */
  readonly contentType = this.registry.contentType;

  private readonly httpRequests: Counter<string>;
  private readonly httpDuration: Histogram<string>;

  constructor(
    @Inject(METRICS_SERVICE_NAME) options: MetricsModuleOptions,
  ) {
    this.registry.setDefaultLabels({
      service: options.service,
      ...(options.defaultLabels || {}),
    });

    this.httpRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      // Sub-millisecond resolution up to 10s requests
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    collectDefaultMetrics({
      register: this.registry,
      // prom-client's option is `timeout` in older typings; cast keeps it simple
      ...({ timeout: options.defaultMetricsInterval ?? 10_000 } as any),
    });
  }

  /** Record one completed HTTP request (called by MetricsInterceptor). */
  observeHttp(
    method: string,
    route: string,
    status: number,
    durationSec: number,
  ): void {
    const labels = { method, route, status: String(status) };
    this.httpRequests.inc(labels);
    this.httpDuration.observe(labels, durationSec);
  }

  /** Create a custom counter registered in this registry. */
  counter(name: string, help: string, labelNames: string[] = []): Counter<string> {
    return new Counter({ name, help, labelNames, registers: [this.registry] });
  }

  /** Create a custom gauge registered in this registry. */
  gauge(name: string, help: string, labelNames: string[] = []): Gauge<string> {
    return new Gauge({ name, help, labelNames, registers: [this.registry] });
  }

  /** Create a custom histogram registered in this registry. */
  histogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ): Histogram<string> {
    return new Histogram({
      name,
      help,
      labelNames,
      ...(buckets ? { buckets } : {}),
      registers: [this.registry],
    });
  }

  /** Prometheus text exposition of all metrics. */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
