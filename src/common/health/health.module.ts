import { DynamicModule, Module } from '@nestjs/common';
import {
  HealthController,
  HEALTH_SERVICE_NAME,
} from './health.controller';

@Module({})
export class HealthModule {
  static forRoot(serviceName: string): DynamicModule {
    return {
      module: HealthModule,
      controllers: [HealthController],
      providers: [
        { provide: HEALTH_SERVICE_NAME, useValue: serviceName },
      ],
    };
  }
}
