// @ts-nocheck
// CANONICAL EXAMPLE: Domain Event Handler Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new event handler.
//
// Key conventions demonstrated:
// 1. @Injectable() service consumed via @OnEvent() decorator
// 2. Method signature: async handle(payload): Promise<void> — never throws to the publisher
// 3. Try/catch wrapping the entire handler — log and report failures, don't crash the publisher
// 4. Idempotency check — handlers must be safe to replay
// 5. Cross-domain reads via repository (allowed) — never call cross-domain services
// 6. Tenant context (companyId) carried in the event payload — not via middleware
// 7. Failure logging includes payload and error stack
// 8. Handler file lives in the consuming sub-module's `event-handlers/` directory (or flat if only one)

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ItemPurchaseCountsRepository } from '../item-purchase-counts.repository';
import {
  DomainEventNames,
  type OrderConfirmedEvent,
} from '@yellowladder/shared-types';

// This handler lives in libs/backend/catalog/item-purchase-counts/src/event-handlers/.
// It listens to ordering.OrderConfirmed and increments item purchase counts.
//
// Why this is in Catalog (not Ordering):
// - ItemPurchaseCount is owned by Catalog (denormalized analytics over MenuItem)
// - Cross-domain WRITES go through domain events, not direct service imports
// - The Ordering service just publishes the event; this handler does the actual work in Catalog

@Injectable()
export class OrderConfirmedHandler {
  private readonly logger = new Logger(OrderConfirmedHandler.name);

  constructor(private readonly repository: ItemPurchaseCountsRepository) {}

  @OnEvent(DomainEventNames.OrderConfirmed)
  async handle(payload: OrderConfirmedEvent): Promise<void> {
    try {
      // Idempotency check — has this order already been counted?
      // The repository tracks which orderIds have been processed via OrderProcessedMarker
      // (or equivalent — the exact mechanism depends on the implementation).
      const alreadyProcessed = await this.repository.hasProcessedOrder(payload.orderId);
      if (alreadyProcessed) {
        this.logger.debug(
          `Order ${payload.orderId} already counted — skipping (idempotent replay)`,
        );
        return;
      }

      // Increment the purchase count for each line item
      // The repository uses the companyId from the event payload to scope the writes correctly.
      // RLS will enforce the company_id automatically when the write transaction sets the context.
      for (const item of payload.items) {
        await this.repository.incrementPurchaseCount({
          menuItemId: item.menuItemId,
          companyId: payload.companyId,
          shopId: payload.shopId,
          quantity: item.quantity,
        });
      }

      // Mark the order as processed for idempotency
      await this.repository.markOrderProcessed(payload.orderId);

      this.logger.log(
        `Incremented purchase counts for ${payload.items.length} items from order ${payload.orderId}`,
      );
    } catch (error) {
      // Handlers must NEVER throw — that would crash the publisher.
      // Log the failure and (optionally) record it for retry later.
      this.logger.error(
        `Failed to handle OrderConfirmed event for order ${payload.orderId}`,
        {
          error: error instanceof Error ? error.stack : String(error),
          payload,
        },
      );

      // Optional: persist a failed-event record for later retry once BullMQ is introduced.
      // For now (no async infra), we log and move on.
    }
  }
}

// NOTE on registration:
// Add this handler as a provider in the consuming sub-module's NestJS module:
//
//   @Module({
//     imports: [EventEmitterModule.forRoot()],
//     providers: [
//       ItemPurchaseCountsService,
//       ItemPurchaseCountsRepository,
//       OrderConfirmedHandler,  // ← register the handler
//     ],
//   })
//   export class ItemPurchaseCountsModule {}
//
// EventEmitterModule must be imported once at the application root (in apps/core-service).
//
// NOTE on event payload types:
// - Event interfaces live in libs/shared/types/src/events/
// - The publisher emits with the constant name: DomainEventNames.OrderConfirmed = 'ordering.OrderConfirmed'
// - The handler imports the event interface from shared/types — NEVER from the publisher's lib
//   (that would create a cross-domain coupling)
