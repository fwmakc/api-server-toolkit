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
 * STRICT contract: publish() rejects when the insert fails. The event row
 * lives in the same database as the business data, so a failed insert is a
 * real failure — callers decide explicitly how to handle it:
 *  - `await publish(..., { manager })` — event joins the caller's transaction
 *    (commits or rolls back together with the business change);
 *  - `await publish(...)` — best-effort delivery with visible failure
 *    (the request errors out if the event could not be queued);
 *  - `publish(...).catch(err => ...)` — deliberate fire-and-forget for
 *    non-critical events.
 * Never call publish() unawaited: an unhandled rejection crashes the
 * process (Node 15+). For audit-style side channels, see AuditService —
 * it catches and logs on purpose.
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

    if (options?.manager) {
      await options.manager.getRepository(this.repo.target).insert(row);
    } else {
      await this.repo.insert(row);
    }
    this.logger.log(`Event queued to outbox: ${pattern}`);
  }
}
