import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { QueueWorker } from '../queue/queue-worker.service';
import { httpPost } from '../helper/http.helper';
import { EventOutboxEntity, OUTBOX_REPOSITORY } from './outbox.entity';
import { buildEventEnvelope } from './outbox.envelope';

/**
 * Drains event_outbox into event-server via the QueueWorker machinery
 * (SKIP LOCKED claim, exponential backoff, stale reclaim, cleanup). A non-2xx
 * answer throws (httpPost) and is retried with backoff; a permanently failed
 * row stays in the table with its error — replayable, unlike the silent drop
 * it replaces. `staleTimeout` must outlast the worst batch
 * (batchSize x http timeout): a slow batch must not be double-claimed by
 * another replica before it finishes POSTing.
 */
@Injectable()
export class OutboxRelayWorker extends QueueWorker<EventOutboxEntity> {
  private readonly eventServerUrl: string;
  private readonly apiKey: string;
  private readonly httpTimeout: number;

  constructor(
    @Inject(OUTBOX_REPOSITORY)
    repo: Repository<EventOutboxEntity>,
    config: ConfigService,
  ) {
    const batchSize = Number(config.get('OUTBOX_BATCH_SIZE', 50));
    const httpTimeout = Number(config.get('OUTBOX_HTTP_TIMEOUT_MS', 5000));
    super(repo, {
      interval: Number(config.get('OUTBOX_INTERVAL_MS', 2000)),
      batchSize,
      maxAttempts: Number(config.get('OUTBOX_MAX_ATTEMPTS', 10)),
      retryDelay: Number(config.get('OUTBOX_RETRY_DELAY', 5)),
      staleTimeout:
        Number(config.get('OUTBOX_STALE_TIMEOUT_MS', 0)) ||
        batchSize * (httpTimeout + 1000) + 60000,
      cleanup: {
        interval: Number(config.get('OUTBOX_CLEANUP_INTERVAL_MS', 3600000)),
        maxAgeDays: Number(config.get('OUTBOX_CLEANUP_MAX_AGE_DAYS', 7)),
        statuses: ['done', 'failed'],
      },
    });
    this.eventServerUrl = config.get<string>(
      'EVENT_SERVER_URL',
      'http://event-server:3005',
    );
    this.apiKey = config.get<string>('INTERNAL_API_KEY', 'changeme');
    this.httpTimeout = httpTimeout;
  }

  protected async process(job: EventOutboxEntity): Promise<void> {
    const body = buildEventEnvelope(
      job.pattern,
      job.payload,
      job.source,
      job.opts,
    );
    await httpPost(`${this.eventServerUrl}/events`, body, {
      headers: { 'X-Internal-Api-Key': this.apiKey },
      timeout: this.httpTimeout,
    });
  }
}
