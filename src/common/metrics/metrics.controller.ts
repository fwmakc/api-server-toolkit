import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

/** Prometheus scrape endpoint: GET /metrics (text/plain). */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.header('Content-Type', this.metrics.contentType);
    res.send(await this.metrics.getMetrics());
  }
}
