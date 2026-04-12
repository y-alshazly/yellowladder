import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Thin wrapper around NestJS's `EventEmitter2` that gives us a stable
 * cross-domain event API. Later we can swap the transport to BullMQ /
 * Google Pub/Sub without touching call sites.
 *
 * **Cross-domain writes MUST go through this publisher.** Direct imports of a
 * different domain's service for a write are forbidden per
 * `.ai/rules/architecture.md` §Cross-Domain Communication.
 */
@Injectable()
export class DomainEventPublisher {
  private readonly logger = new Logger(DomainEventPublisher.name);

  constructor(private readonly emitter: EventEmitter2) {}

  /**
   * Publish a domain event synchronously (via NestJS EventEmitter2).
   * Consumers use `@OnEvent(topic)` to subscribe. Handlers must be
   * idempotent — the in-process transport offers no replay guarantees but
   * we design for at-least-once so a future broker is a drop-in.
   */
  publish<TPayload>(topic: string, payload: TPayload): void {
    this.logger.debug(`Publishing domain event ${topic}`);
    this.emitter.emit(topic, payload);
  }

  /**
   * Async variant. Returns a promise that resolves once every handler has
   * settled. Use for events whose handlers do non-trivial I/O and where you
   * want failures to surface to the caller (still synchronous in-process).
   */
  async publishAsync<TPayload>(topic: string, payload: TPayload): Promise<void> {
    this.logger.debug(`Publishing async domain event ${topic}`);
    await this.emitter.emitAsync(topic, payload);
  }
}
