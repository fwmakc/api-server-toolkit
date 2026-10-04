import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { IEventClient, PublishOptions } from './event-client.interfaces';
import { EventOutboxEntity, OUTBOX_REPOSITORY } from './outbox.entity';

/**
 * IEventClient implementation backed by the local event_outbox table.
 * publish() persists the envelope (durable) and returns; a relay worker
 * delivers rows to event-server with retries — an event-server outage or
 * an overload burst delays events instead of losing them.
 *
 * Contract parity with HttpEventClient: without `options.manager` publish()
 * NEVER rejects — a failed insert is logged, not thrown (call sites stay
 * unawaited without crash risk). With `manager` (the caller's transaction)
 * insert failures propagate, so the event commits or rolls back together
 * with the business change.
 */
@Injectable()
export class OutboxEventClient extends IEventClient {
  private readonly logger = new Logger(OutboxEventClient.name);
  private readonly serviceName: string;

  constructor(
    @Inject(OUTBOX_REPOSITORY)
    private readonly repo: Repository<EventOutboxEntity>,
    config: ConfigService,
  ) {
    super();
    this.serviceName = config.get<string>('SERVICE_NAME', 'unknown');
  }

  async publish(
    pattern: string,
    payload: Record<string, unknown>,
    options?: PublishOptions,
  ): Promise<void> {
    const row = {
      pattern,
      payload,
      source: options?.source ?? this.serviceName,
      opts: {
        broadcast: options?.broadcast,
        priority: options?.priority,
        delay: options?.delay,
        log: options?.log,
        ttl: options?.ttl,
      },
    };

    try {
      if (options?.manager) {
        await options.manager
          .getRepository(this.repo.target)
          .insert(row);
      } else {
        await this.repo.insert(row);
      }
      this.logger.log(`Event queued to outbox: ${pattern}`);
    } catch (err) {
      if (options?.manager) throw err;
      this.logger.error(
        `Failed to queue event "${pattern}" to outbox: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
