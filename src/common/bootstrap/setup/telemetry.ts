export interface TelemetryOptions {
  serviceName: string;
  otlpEndpoint?: string;
}

export const Telemetry = {
  setup(app: any, opts: TelemetryOptions): void {
    try {
      const { NodeSDK } = require('@opentelemetry/sdk-node');
      const { NodeTracerProvider } = require('@opentelemetry/sdk-tracing');
      const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
      const { Resource } = require('@opentelemetry/resources');
      const { trace, context, propagation } = require('@opentelemetry/api');

      const provider = new NodeTracerProvider({
        resource: new Resource({ ['service.name']: opts.serviceName }),
        traceExporter: new OTLPTraceExporter({
          url: opts.otlpEndpoint || process.env.OTEL_ENDPOINT || 'http://localhost:4318',
        }),
      });

      const sdk = new NodeSDK({ tracerProvider: provider });
      sdk.start();

      const previousEmit: any = process.emit.bind(process);
      (process as any).emit = function (event: string, ...args: any[]): boolean {
        if (event === 'exit') {
          sdk.shutdown().then(() => previousEmit(event, ...args));
          return true;
        }
        return previousEmit(event, ...args);
      };

      app.use((req, res, next) => {
        const span = trace.getSpan(context.active());
        if (span) {
          const headers: Record<string, string> = {};
          propagation.inject(context.active(), headers);
          req.headers = { ...req.headers, ...headers };
        }
        next();
      });
    } catch {
      // OTel not installed — silently skip
    }
  },
};
