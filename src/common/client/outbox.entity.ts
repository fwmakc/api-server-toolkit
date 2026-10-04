import { Column } from 'typeorm';
import { QueueJobEntity } from '../queue/queue-job.entity';

/** Delivery options preserved alongside the envelope (see IEventClient.publish). */
export interface OutboxOptions {
  broadcast?: boolean;
  priority?: 'low' | 'normal' | 'high';
  delay?: number;
  log?: boolean;
  ttl?: number;
}

/**
 * Undecorated column set for the local event_outbox table — services declare
 * their own `@Entity('event_outbox')` subclass (TypeORM entities must live in
 * the service for glob-based entity loading, same pattern as QueueJobEntity /
 * mail_jobs). One row = one unpublished event: written in the SAME transaction
 * as the business change (pass `manager` in PublishOptions) or, without a
 * manager, in its own implicit one — durable locally before the relay delivers
 * it, so an event-server outage or a crash delays events but never loses them.
 */
export class EventOutboxEntity extends QueueJobEntity {
  @Column({ type: 'varchar' })
  pattern: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @Column({ type: 'jsonb', nullable: true })
  opts: OutboxOptions | null;
}

/** DI token for the service's outbox repository (built by OutboxModule). */
export const OUTBOX_REPOSITORY = 'OUTBOX_REPOSITORY';
