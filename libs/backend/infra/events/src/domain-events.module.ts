import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DomainEventPublisher } from './domain-event-publisher.service';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      maxListeners: 50,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  providers: [DomainEventPublisher],
  exports: [DomainEventPublisher],
})
export class DomainEventsModule {}
