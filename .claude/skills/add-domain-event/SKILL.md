---
name: add-domain-event
description: Add a new domain event (interface, publisher class, consumer handler) to enable cross-domain coupling without direct imports. Owned by backend-engineer.
argument-hint: <publisher-domain.EventName> <consumer-domain-submodule>
---

# Add Domain Event

Create a new domain event with its publisher and consumer handler. Cross-domain WRITES MUST use domain events — direct cross-domain service imports are forbidden.

**Owner:** `backend-engineer` agent.

**Arguments:**
- `$1` — fully-qualified event name in `dot.PascalCase` form (e.g., `ordering.OrderConfirmed`, `catalog.MenuItemActivated`)
- `$2` — consumer sub-module (e.g., `catalog/item-purchase-counts`, `integrations/email`)

## Pre-flight checks

1. Read `.claude/rules/architecture.md` §Cross-Domain Communication
2. Read `.claude/rules/domain-model.md` §Critical Integration Events to confirm the event is documented or to add it
3. Read `.claude/examples/canonical-event-handler.ts` for the handler pattern
4. Confirm the publisher and consumer are in **different domains** — within-domain coupling can use direct imports

## Steps

1. **Parse the event name:**
   - Publisher domain = part before the dot (e.g., `ordering`)
   - Event name = part after the dot in PascalCase (e.g., `OrderConfirmed`)
   - Constant name = SCREAMING_SNAKE_CASE (e.g., `ORDER_CONFIRMED`)

2. **Add the event interface** to `libs/shared/types/src/events/${event-kebab}.event.ts`:
   ```typescript
   export interface OrderConfirmedEvent {
     orderId: string;
     companyId: string;
     shopId: string;
     items: Array<{
       menuItemId: string;
       quantity: number;
       unitPrice: number;
     }>;
     confirmedAt: Date;
   }
   ```

3. **Add the event name constant** to `libs/shared/types/src/events/event-names.constants.ts`:
   ```typescript
   export const DomainEventNames = {
     // ... existing events
     OrderConfirmed: 'ordering.OrderConfirmed',
   } as const;

   export type DomainEventName = typeof DomainEventNames[keyof typeof DomainEventNames];
   ```

4. **Update `shared/types/src/index.ts`** barrel to re-export the new event interface and constant.

5. **Publish the event from the publisher service** (`libs/backend/{publisher-domain}/{publisher-submodule}/src/${submodule}.service.ts`):
   ```typescript
   import { DomainEventPublisher, DomainEventNames, type OrderConfirmedEvent } from '@yellowladder/shared-types';
   // ... or wherever DomainEventPublisher is exported from

   const event: OrderConfirmedEvent = {
     orderId: order.id,
     companyId: order.companyId,
     shopId: order.shopId,
     items: order.items.map(...),
     confirmedAt: new Date(),
   };
   await this.domainEventPublisher.publish(DomainEventNames.OrderConfirmed, event);
   ```

6. **Create the event handler** in the consumer sub-module at `libs/backend/$2/src/event-handlers/${event-kebab}.handler.ts`:
   - If this is the only handler, place it at `libs/backend/$2/src/${event-kebab}.handler.ts` (flat — no `event-handlers/` directory yet)
   - If there are 2+ handlers, group them in `event-handlers/`
   - Use `.claude/examples/canonical-event-handler.ts` as the template

   ```typescript
   import { Injectable, Logger } from '@nestjs/common';
   import { OnEvent } from '@nestjs/event-emitter';
   import { DomainEventNames, type OrderConfirmedEvent } from '@yellowladder/shared-types';

   @Injectable()
   export class OrderConfirmedHandler {
     private readonly logger = new Logger(OrderConfirmedHandler.name);

     constructor(private readonly repository: ItemPurchaseCountsRepository) {}

     @OnEvent(DomainEventNames.OrderConfirmed)
     async handle(payload: OrderConfirmedEvent): Promise<void> {
       try {
         // Idempotency check
         if (await this.repository.hasProcessedOrder(payload.orderId)) {
           return;
         }
         // Do the work
         for (const item of payload.items) {
           await this.repository.incrementPurchaseCount(item.menuItemId, item.quantity);
         }
         await this.repository.markOrderProcessed(payload.orderId);
       } catch (error) {
         // Handlers must NEVER throw — log and move on
         this.logger.error(`Failed to handle ${DomainEventNames.OrderConfirmed}`, { error, payload });
       }
     }
   }
   ```

7. **Register the handler as a provider** in the consumer sub-module's NestJS module:
   ```typescript
   @Module({
     providers: [
       ItemPurchaseCountsService,
       ItemPurchaseCountsRepository,
       OrderConfirmedHandler, // ← add this
     ],
   })
   export class ItemPurchaseCountsModule {}
   ```

8. **Verify `EventEmitterModule.forRoot()`** is imported in the application root (`apps/core-service/src/app/app.module.ts`).

9. **Update the barrel** at the consumer sub-module's `src/index.ts` if necessary.

## Hard rules

- **Cross-domain WRITES MUST use domain events** — never call cross-domain services directly to perform writes
- **Cross-domain READS may use barrel imports** (e.g., reading menu data from Catalog into Ordering at order time)
- **Handlers must be idempotent** — same event delivered twice must produce the same result
- **Handlers must NEVER throw** — they would crash the publisher. Always wrap in try/catch and log
- **Event interfaces live in `shared/types`** — never in publisher or consumer libs (avoids cross-domain coupling on event types)
- **Event constants in `shared/types/events/event-names.constants.ts`** — single source of truth for event identifiers

## Hand-off

After the event and handler are in place:
- Test by triggering the publisher action and verifying the consumer handler runs
- Add the new event to `.claude/rules/domain-model.md` §Critical Integration Events
- If multiple consumers are needed, repeat the handler creation step for each
