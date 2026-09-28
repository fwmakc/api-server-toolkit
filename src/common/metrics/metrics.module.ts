import {
  DynamicModule,
  Module,
  Provider,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsController } from './metrics.controller';
import {
  MetricsInterceptor,
} from './metrics.interceptor';
import {
  MetricsModuleOptions,
  MetricsService,
  METRICS_SERVICE_NAME,
} from './metrics.service';

@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: METRICS_SERVICE_NAME,
      useValue: options,
    };

    return {
      module: MetricsModule,
      controllers: [MetricsController],
      providers: [
        optionsProvider,
        MetricsService,
        { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
      ],
      exports: [MetricsService],
    };
  }
}
