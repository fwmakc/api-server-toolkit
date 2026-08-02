import { Controller, Get, Inject } from '@nestjs/common';

export const HEALTH_SERVICE_NAME = 'HEALTH_SERVICE_NAME';

@Controller()
export class HealthController {
  constructor(
    @Inject(HEALTH_SERVICE_NAME) private readonly serviceName: string,
  ) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: this.serviceName,
    };
  }
}
