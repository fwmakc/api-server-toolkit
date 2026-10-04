import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { IEventClient } from './event-client.interfaces';
import { OutboxEventClient } from './outbox-client.service';
import { OutboxRelayWorker } from './outbox-relay.service';
import { EventOutboxEntity, OUTBOX_REPOSITORY } from './outbox.entity';

/**
 * Durable event publishing: publish() writes into the local event_outbox
 * table (the service's own DB), a relay worker delivers to event-server
 * with retries. Swap-in replacement for EventClientModule — the provided
 * IEventClient token and the wire envelope are identical to HttpEventClient,
 * so call sites and subscribers stay untouched.
 *
 * Requires a service-local entity (TypeORM entities must live in the
 * service for glob-based loading) and an event_outbox migration:
 *
 *   @Entity('event_outbox')
 *   export class AuthOutboxEntity extends EventOutboxEntity {}
 *
 *   OutboxModule.forRoot(AuthOutboxEntity)
 */
@Module({})
export class OutboxModule {
  static forRoot(entity: typeof EventOutboxEntity): DynamicModule {
    return {
      module: OutboxModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: OUTBOX_REPOSITORY,
          useFactory: (dataSource: DataSource) => dataSource.getRepository(entity),
          inject: [DataSource],
        },
        OutboxEventClient,
        OutboxRelayWorker,
        { provide: IEventClient, useExisting: OutboxEventClient },
      ],
      exports: [IEventClient],
    };
  }
}
