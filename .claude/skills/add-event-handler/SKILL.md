---
name: add-event-handler
description: Add a consumer handler for an existing domain event in another sub-module. Owned by backend-engineer.
argument-hint: <event-name> <consumer-submodule>
---

# Add Event Handler

Add a new `@OnEvent()` consumer handler for an existing domain event.

**Owner:** `backend-engineer` agent.

**Arguments:**
- `$1` — event name (e.g., `OrderConfirmed`, `MenuItemActivated`) — must already exist in `shared/types`
- `$2` — consumer sub-module path (e.g., `integrations/email`, `catalog/item-purchase-counts`)

## Pre-flight checks

1. Confirm the event exists in `libs/shared/types/src/events/`
2. Confirm the event name constant is in `event-names.constants.ts`
3. Confirm the consumer sub-module `libs/backend/$2/` exists
4. Read `.claude/examples/canonical-event-handler.ts` for the pattern

## Steps

1. **Find the event interface** to understand the payload shape:
   ```bash
   grep -r "interface ${1}Event" libs/shared/types/src/events/
   ```

2. **Read the consumer sub-module structure** to determine where to place the handler:
   - If no handlers exist yet → create the handler at `libs/backend/$2/src/${event-kebab}.handler.ts` (flat)
   - If 1 handler exists → create `event-handlers/` directory and move the existing handler in (per the file-grouping rule)
   - If `event-handlers/` already exists → add to it

3. **Create the handler file** following the pattern from `.claude/examples/canonical-event-handler.ts`:

   ```typescript
   import { Injectable, Logger } from '@nestjs/common';
   import { OnEvent } from '@nestjs/event-emitter';
   import { DomainEventNames, type ${1}Event } from '@yellowladder/shared-types';
   import { ${ConsumerService} } from '../${consumer}.service';

   @Injectable()
   export class ${1}Handler {
     private readonly logger = new Logger(${1}Handler.name);

     constructor(
       // Inject the services or repositories the handler needs
       private readonly service: ${ConsumerService},
     ) {}

     @OnEvent(DomainEventNames.${1})
     async handle(payload: ${1}Event): Promise<void> {
       try {
         // Idempotency check (if applicable)
         // ...

         // Do the work
         await this.service.someMethod(payload);
       } catch (error) {
         // Never throw — log and move on
         this.logger.error(
           `Failed to handle ${DomainEventNames.${1}}`,
           { error: error instanceof Error ? error.stack : String(error), payload },
         );
       }
     }
   }
   ```

4. **Register the handler as a provider** in the consumer sub-module's `${submodule}.module.ts`:
   ```typescript
   @Module({
     providers: [
       // ... existing providers
       ${1}Handler,
     ],
   })
   export class ${Submodule}Module {}
   ```

5. **Verify `EventEmitterModule`** is imported in the consuming module (or in the root module).

6. **Update the barrel** at `src/index.ts` only if the handler needs to be exported (typically not — handlers are internal).

## Hard rules

- **Handlers MUST NOT throw** — wrap the entire body in try/catch
- **Handlers MUST be idempotent** — replaying the same event should produce the same result
- **Import event interfaces from `@yellowladder/shared-types`** — NEVER from the publisher's lib (would create a cross-domain coupling)
- **Use the constant `DomainEventNames.${1}`** in `@OnEvent()`, never a hardcoded string
- **One handler per file** — when 2+ exist, group them in `event-handlers/` per the file-grouping convention
- **The handler should NOT call cross-domain services directly** — if it needs to write to another domain, publish another domain event

## Common pitfalls

- **Forgetting to register the handler as a provider** — the handler file exists but `@OnEvent` never fires
- **Forgetting `EventEmitterModule.forRoot()`** in the root module — no events fire at all
- **Throwing from the handler** — crashes the publisher and silently breaks downstream events
- **Not checking for idempotency** — replaying produces double counts, double emails, etc.

## Hand-off

After the handler is in place:
- Manually test by triggering the publisher action
- Verify the handler runs by checking logs
- If the handler needs new repository methods, add them to the repository file
