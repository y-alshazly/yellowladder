---
description: Backend NestJS conventions — file naming, modules, controllers, DTOs, repositories, domain events, CASL, multi-tenancy, Prisma
alwaysApply: false
paths:
  - 'libs/backend/**'
  - 'apps/core-service/**'
---

# Backend Conventions (NestJS)

## File Naming

All files use `kebab-case.{suffix}.ts`:

| File Type      | Suffix              | Example                          |
| -------------- | ------------------- | -------------------------------- |
| Module         | `.module.ts`        | `menu-items.module.ts`           |
| Controller     | `.controller.ts`    | `menu-items.controller.ts`       |
| Service        | `.service.ts`       | `menu-items.service.ts`          |
| Repository     | `.repository.ts`    | `menu-items.repository.ts`       |
| Event handler  | `.handler.ts`       | `payment-completed.handler.ts`   |
| Field registry | `-field-registry.ts`| `menu-items-field-registry.ts`   |
| DTO            | `.dto.ts`           | `create-menu-item.dto.ts`        |
| Domain event   | `.event.ts`         | `order-confirmed.event.ts`       |
| Guard          | `.guard.ts`         | `authentication.guard.ts`        |
| Middleware     | `.middleware.ts`    | `tenant-context.middleware.ts`   |
| Interceptor    | `.interceptor.ts`   | `audit-log.interceptor.ts`       |
| Decorator      | `.decorator.ts`     | `current-ability.decorator.ts`   |
| Gateway        | `.gateway.ts`       | `kitchen.gateway.ts`             |

## Testing

**Testing is deferred during the refactor.** Do not author `*.spec.ts` or `*.integration-spec.ts` files unless the user explicitly asks. No coverage thresholds apply.

## Sub-Module Structure

One NestJS module per backend sub-module lib. When a sub-module has multiple files of the same type, group them in a subdirectory. A single file of a type stays flat at the root.

```text
libs/backend/ordering/orders/src/
  index.ts                                # Barrel file
  orders.module.ts                        # NestJS module
  orders.controller.ts                    # Thin controller
  orders.service.ts                       # Business logic
  orders.repository.ts                    # Wraps Prisma queries
  event-handlers/                         # @OnEvent handlers (2+ → grouped)
    payment-completed.handler.ts
    refund-completed.handler.ts
  dtos/                                   # Multiple DTOs → grouped
    create-order.dto.ts
    update-order-status.dto.ts
    get-orders-query.dto.ts
    get-order.dto.ts
    get-order-item.dto.ts
  events/                                 # Multiple domain events → grouped
    order-confirmed.event.ts
    order-cancelled.event.ts
```

Follow the file grouping convention from `architecture.md`.

## Method Naming

**Hybrid convention:** generic names for the primary entity, entity-qualified names for secondary/nested entities.

### Primary Entity (the entity the sub-module owns)

| Operation   | Controller      | Service      | Repository   |
| ----------- | --------------- | ------------ | ------------ |
| Create one  | `createOne`     | `createOne`  | `createOne`  |
| Create many | `createMany`    | `createMany` | `createMany` |
| Read one    | `getOneById`    | `getOne`     | `findOne`    |
| Read many   | `getMany`       | `getMany`    | `findMany`   |
| Update one  | `updateOneById` | `updateOne`  | `updateOne`  |
| Update many | `updateMany`    | `updateMany` | `updateMany` |
| Delete one  | `deleteOneById` | `deleteOne`  | `deleteOne`  |
| Delete many | `deleteMany`    | `deleteMany` | `deleteMany` |

### Secondary Entity (nested/child entities managed by the same sub-module)

| Operation  | Controller       | Service          | Repository       |
| ---------- | ---------------- | ---------------- | ---------------- |
| Create one | `create{Entity}` | `create{Entity}` | `create{Entity}` |
| Read one   | mirrors service  | `get{Entity}`    | `find{Entity}`   |
| Read many  | mirrors service  | `get{Entities}`  | `find{Entities}` |
| Update one | mirrors service  | `update{Entity}` | `update{Entity}` |
| Delete one | mirrors service  | `delete{Entity}` | `delete{Entity}` |

### Verb Vocabulary

- **Repository:** `find` (returns `null` on miss), `create`, `update`, `delete`, `count`, `exists`, `upsert`
- **Service:** `get` (throws `BusinessException` on miss), `create`, `update`, `delete`. Exception: use `find` prefix for lookups commonly used for existence checks (e.g., `findOneByEmail` used by authentication login).
- **Alternate-key lookups:** `findOneBy{Field}` (repository), `getOneBy{Field}` or `findOneBy{Field}` (service — based on throw/null behavior)
- **Status transitions:** bare verb for primary entity (`confirm`, `cancel`, `markPaid`), qualified for secondary
- **Domain operations:** keep domain-specific verbs as-is (`addItemToCart`, `clearCart`, `mergeSessionCartOnLogin`, `handleStripeWebhook`, `runDailyXeroSync`, etc.)

## Controllers

Controllers are thin. They handle HTTP concerns and DTO conversion only. Services work with repository input types, so controllers map between DTOs and repository types using `toInput()` / `toDto()` static methods.

**All routes are versioned at `/api/v1/`.** Use the global prefix configured in `apps/core-service/src/main.ts`.

```typescript
@ApiMenuItems()
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Post()
  @ApiMenuItems('createOne')
  @AuditLog({ action: 'Create', resource: 'MenuItem' })
  async createOne(
    @CurrentAbility() ability: AppAbility,
    @CurrentCompany() companyId: string,
    @Body() dto: CreateMenuItemDto,
  ): Promise<GetMenuItemDto> {
    const menuItem = await this.menuItemsService.createOne(
      ability,
      companyId,
      CreateMenuItemDto.toInput(dto),
    );
    return GetMenuItemDto.toDto(menuItem);
  }

  @Get()
  @ApiMenuItems('getMany')
  async getMany(
    @CurrentAbility() ability: AppAbility,
    @Query() query: GetMenuItemsQueryDto,
  ): Promise<PaginatedResponse<GetMenuItemDto>> {
    const { data, meta } = await this.menuItemsService.getMany(ability, query);
    return { data: data.map((item) => GetMenuItemDto.toDto(item)), meta };
  }

  @Get(':id')
  @ApiMenuItems('getOneById')
  async getOneById(
    @CurrentAbility() ability: AppAbility,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const menuItem = await this.menuItemsService.getOne(ability, { id });
    return GetMenuItemDto.toDto(menuItem);
  }
}
```

- `@CurrentAbility()` is passed to every service method for authorization.
- `@CurrentCompany()` extracts `companyId` from the JWT (set by `TenantContextMiddleware`).
- `@CurrentUser()` is only passed when the service needs user identity for business logic (e.g., `createdBy`, `assignedTo`), NOT for authorization scoping — CASL handles that.
- `@AuditLog()` is a declarative decorator on write endpoints.
- `ParseUUIDPipe` on all `:id` route params for input validation.
- Controllers call `CreateMenuItemDto.toInput(dto)` to convert request DTOs to named repository input types.
- Controllers call `GetMenuItemDto.toDto(entity)` to convert service return values to response DTOs.
- Service methods accept `where: Record<string, unknown>` (not bare `id: string`), so controllers pass `{ id }` objects to enable CASL `mergeConditionsIntoWhere`.

## Swagger Decorators

Each sub-module that has 3+ controller methods extracts Swagger decorators into a `*.swagger.ts` file using a combined class/method decorator pattern:

```typescript
// menu-items.swagger.ts
import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type MenuItemsMethod = 'createOne' | 'getMany' | 'getOneById' | 'updateOneById' | 'deleteOneById';

const methodDecorators: Record<MenuItemsMethod, () => MethodDecorator> = {
  createOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create a new menu item' }),
      ApiResponse({ status: 201, type: GetMenuItemDto }),
    ),
  // ... one entry per controller method
};

export function ApiMenuItems(): ClassDecorator;
export function ApiMenuItems(method: MenuItemsMethod): MethodDecorator;
export function ApiMenuItems(method?: MenuItemsMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Menu Items'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
```

Usage: `@ApiMenuItems()` on class, `@ApiMenuItems('createOne')` on methods.

## Data Flow

Services work with named repository input types. Controllers handle all DTO conversion via static mapper methods on DTO classes:

```text
Controller ──toInput()──> Service ──────────> Repository ──> Prisma
  (DTO)      (named repo    (named repo         (Prisma
              input type)    input type)          types)

Repository ──> Service ──────────> Controller ──toDto()──> HTTP Response
  (Prisma      (entity or          (GetMenuItemDto)
   entity)      Record<string, unknown>
                from pickPermittedFields)
```

| Boundary             | Input                                                       | Output                                                 |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Controller → Service | Named repo type (e.g., `CreateMenuItemInput` via `toInput()`) | `Record<string, unknown>` (from `pickPermittedFields`) |
| Service → Repository | Named repo type (e.g., `CreateMenuItemInput`)               | Prisma entity                                          |
| Controller → HTTP    | —                                                           | `GetMenuItemDto` (via `toDto()`)                       |

## DTO Naming

| Concern        | `shared/types` Interface  | Backend DTO Class       |
| -------------- | ------------------------- | ----------------------- |
| Create request | `CreateMenuItemRequest`   | `CreateMenuItemDto`     |
| Update request | `UpdateMenuItemRequest`   | `UpdateMenuItemDto`     |
| Response       | `GetMenuItemResponse`     | `GetMenuItemDto`        |
| Query params   | —                         | `GetMenuItemsQueryDto`  |

## Request DTOs (class-validator)

Request DTOs are classes with class-validator decorators that implement the corresponding `shared/types` interface. Each request DTO has a `static toInput()` method that returns the named repository input type:

```typescript
import { IsString, IsUUID, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMenuItemRequest } from '@yellowladder/shared-types';
import type { CreateMenuItemInput } from '../menu-items.repository';

export class CreateMenuItemDto implements CreateMenuItemRequest {
  [key: string]: unknown; // Required for CASL ensureFieldsPermitted

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @IsNumber()
  basePrice: number;

  static toInput(dto: CreateMenuItemDto): CreateMenuItemInput {
    return {
      nameEn: dto.nameEn,
      nameAr: dto.nameAr,
      categoryId: dto.categoryId,
      basePrice: dto.basePrice,
    };
  }
}
```

- Every request DTO class `implements` its `shared/types` interface.
- `[key: string]: unknown` index signature required for CASL `ensureFieldsPermitted` to iterate fields.
- `static toInput()` returns the named repository input type, not raw Prisma types.
- Use `@ApiProperty()` on every field for Swagger generation.
- Global `ValidationPipe` handles validation — no manual validation in controllers.
- **No Zod for request validation on the backend** — class-validator handles that.

## Response DTOs

Response DTOs have a `static toDto()` method for Prisma entity-to-DTO mapping. No injectable mapper classes:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { MenuItem } from '@prisma/client';
import { GetMenuItemResponse } from '@yellowladder/shared-types';

export class GetMenuItemDto implements GetMenuItemResponse {
  @ApiProperty() id: string;
  @ApiProperty() nameEn: string;
  @ApiProperty() nameAr: string;
  @ApiProperty() basePrice: number;

  static toDto(entity: MenuItem): GetMenuItemDto {
    const dto = new GetMenuItemDto();
    dto.id = entity.id;
    dto.nameEn = entity.nameEn;
    dto.nameAr = entity.nameAr;
    dto.basePrice = entity.basePrice;
    return dto;
  }
}
```

- Response DTO class name follows `Get{Entity}Dto` pattern. The `shared/types` interface is `Get{Entity}Response`.
- `static toDto()` accepts the Prisma entity type (or entity with includes for relations).
- For entities with relations: `static toDto(entity: MenuItem & { addons: MenuAddon[] }): GetMenuItemDto`.

## Repository Pattern

Each sub-module has a `*.repository.ts` that wraps Prisma queries. Services never call Prisma directly.

**Named input types:** Repositories export named input types (e.g., `CreateMenuItemInput`) as `Omit<Prisma.MenuItemUncheckedCreateInput, ...>`, excluding auto-generated fields.

**Typed parameters:** All method parameters use Prisma's generated types (`Prisma.MenuItemWhereInput`, `Prisma.MenuItemOrderByWithRelationInput`). Never use `unknown`, `Record<string, unknown>`, or `as never` casts.

**`findOne` accepts WHERE input:** `findOne(where: Prisma.MenuItemWhereInput)` — not `findOne(id: string)`. This enables CASL `mergeConditionsIntoWhere` to pass its full WHERE object through.

**JSON fields:** Use `Prisma.InputJsonValue` for JSON field types (never `as never`).

```typescript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

// Named input types — exported for service and DTO use
export type CreateMenuItemInput = Omit<
  Prisma.MenuItemUncheckedCreateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class MenuItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.MenuItemWhereInput) {
    return this.prisma.menuItem.findFirst({ where });
  }

  async findMany(
    where: Prisma.MenuItemWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.MenuItemOrderByWithRelationInput | Prisma.MenuItemOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({ where, skip, take, orderBy }),
      this.prisma.menuItem.count({ where }),
    ]);
    return { items, total };
  }

  async createOne(input: CreateMenuItemInput & { companyId: string }) {
    return this.prisma.menuItem.create({ data: input });
  }
}
```

`PrismaService` is injected as the default tenant-scoped client. The Proxy ensures every operation runs inside a transaction with `SET LOCAL app.current_company` set from `TenantContextStore`.

**Never use `$queryRawUnsafe` with user input.** If raw SQL is needed, escalate to the `architect`.

## Error Handling

Use `BusinessException` from `@yellowladder/backend-infra-database` (or wherever the exception base lives) with domain-specific error codes from `@yellowladder/shared-types`. Never throw raw NestJS exceptions (`NotFoundException`, `ConflictException`, etc.) from service methods:

```typescript
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '@yellowladder/backend-infra-database';
import { CatalogMenuItemsErrors } from '@yellowladder/shared-types';

// CORRECT — domain error code + human-readable message + HTTP status + optional metadata
throw new BusinessException(
  CatalogMenuItemsErrors.MenuItemNotFound,
  'Menu item not found',
  HttpStatus.NOT_FOUND,
);

throw new BusinessException(
  CatalogMenuItemsErrors.NameAlreadyExists,
  `Menu item with name "${dto.nameEn}" already exists`,
  HttpStatus.CONFLICT,
  { nameEn: dto.nameEn },
);

// WRONG — raw NestJS exception, no domain error code
throw new NotFoundException('Menu item not found');
```

Error codes are defined per sub-module in `libs/shared/types/src/errors/error-codes.constants.ts`:

```typescript
export const CatalogMenuItemsErrors = {
  MenuItemNotFound: 'CATALOG.MENU_ITEMS.MENU_ITEM_NOT_FOUND',
  NameAlreadyExists: 'CATALOG.MENU_ITEMS.NAME_ALREADY_EXISTS',
  CategoryNotFound: 'CATALOG.MENU_ITEMS.CATEGORY_NOT_FOUND',
} as const;
```

## Domain Events

Publish via `DomainEventPublisher` wrapping `EventEmitter2`. Consume via `@OnEvent()`:

```typescript
// Publishing
await this.eventPublisher.publish('ordering.OrderConfirmed', {
  orderId: order.id,
  companyId: order.companyId,
  shopId: order.shopId,
  items: order.items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
});

// Consuming (in a different sub-module — e.g., catalog item-purchase-counts)
@OnEvent('ordering.OrderConfirmed')
async handleOrderConfirmed(payload: OrderConfirmedEvent): Promise<void> {
  for (const item of payload.items) {
    await this.itemPurchaseCountsService.increment(item.menuItemId, item.quantity);
  }
}
```

- Cross-domain WRITES MUST use domain events. Direct cross-domain service imports for writes are forbidden (see `architecture.md`).
- Event payloads are typed and live in the producing lib's `events/` directory.
- Handlers must be **idempotent**. Replaying the same event must not produce double-counted side effects.
- Design the publisher interface so that migrating to a message broker later is a transport swap, not a rewrite. **Defer** the migration until a second async use case appears.

## Authorization (CASL — service layer)

- Authorization is handled in **services**, not guards. This ensures it runs regardless of entry point (HTTP, events, scheduled jobs, internal calls).
- Controllers pass the user's `AppAbility` (built by `AbilityFactory` from the user's `role` and `shopIds`) to service methods via `@CurrentAbility()` param decorator.
- Services inject `AuthorizationService` from `@yellowladder/backend-identity-authorization` and call:
  - `requirePermission(ability, action, resource)` — type-level gate
  - `mergeConditionsIntoWhere(ability, action, resource, baseWhere)` — bakes authorization into Prisma queries via `@casl/prisma`
  - `ensureFieldsPermitted(ability, input, resource, action)` — field-level write checks
  - `pickPermittedFields(ability, entity, resource, action)` — field-level read filtering on the Prisma entity before returning to controller
- Action naming: plain verbs (`Create`, `Read`, `Update`, `Delete`, `Publish`, `View`, `Manage`).
- When `ability` is `undefined` (system/internal calls), gate methods deny, filtering methods are no-ops.
- **No `PolicyGuard`, no `@RequirePermission()` decorator.** Use `AuthenticationGuard` for authentication only.

### 5-Method Service Flow

Every service method that touches data must follow this exact authorization flow. Skipping any step is a bug:

```text
Create: requirePermission → ensureFieldsPermitted → ensureConditionsMet → repository.create → pickPermittedFields
Read:   requirePermission → mergeConditionsIntoWhere → repository.find → pickPermittedFields
Update: requirePermission → mergeConditionsIntoWhere (fetch) → ensureFieldsPermitted → repository.update → pickPermittedFields
Delete: requirePermission → mergeConditionsIntoWhere (fetch) → repository.delete
```

```typescript
async createOne(ability: AppAbility | undefined, companyId: string, input: CreateMenuItemInput) {
  this.authorizationService.requirePermission(ability, 'Create', 'MenuItem');
  this.authorizationService.ensureFieldsPermitted(ability, input, 'MenuItem', 'Create');
  this.authorizationService.ensureConditionsMet(ability, { ...input, companyId }, 'MenuItem', 'Create');
  const menuItem = await this.repository.createOne({ ...input, companyId });
  return this.authorizationService.pickPermittedFields(ability, menuItem, 'MenuItem', 'Read');
}

async getMany(ability: AppAbility | undefined, query: GetMenuItemsQueryDto) {
  this.authorizationService.requirePermission(ability, 'Read', 'MenuItem');
  const baseWhere = buildWhereFromQuery(query);
  const where = this.authorizationService.mergeConditionsIntoWhere(ability, 'Read', 'MenuItem', baseWhere);
  const { items, total } = await this.repository.findMany(where, query.skip, query.take, query.orderBy);
  return {
    data: items.map((i) => this.authorizationService.pickPermittedFields(ability, i, 'MenuItem', 'Read')),
    meta: { total, take: query.take, skip: query.skip },
  };
}

async updateOne(ability: AppAbility | undefined, where: { id: string }, input: UpdateMenuItemInput) {
  this.authorizationService.requirePermission(ability, 'Update', 'MenuItem');
  const mergedWhere = this.authorizationService.mergeConditionsIntoWhere(ability, 'Update', 'MenuItem', where);
  const existing = await this.repository.findOne(mergedWhere);
  if (!existing) throw new BusinessException(CatalogMenuItemsErrors.MenuItemNotFound, 'Menu item not found', HttpStatus.NOT_FOUND);
  this.authorizationService.ensureFieldsPermitted(ability, input, 'MenuItem', 'Update');
  const updated = await this.repository.updateOne(existing.id, input);
  return this.authorizationService.pickPermittedFields(ability, updated, 'MenuItem', 'Read');
}
```

**Common violations to avoid:**

- Using `'Manage'` as an action instead of specific verbs (`Create`, `Read`, `Update`, `Delete`). `Manage` is a policy-level wildcard, not a service-level action.
- Forgetting `pickPermittedFields` on the return value — leaks fields the user shouldn't see.
- Forgetting `ensureFieldsPermitted` on write inputs — allows writing to restricted fields.
- Calling `mergeConditionsIntoWhere` with the wrong action.
- Skipping the shop scoping check for shop-scoped entities. Use the base service helper or include `shopId IN user.shopIds` in the WHERE.

## Pagination

All list endpoints use offset-based pagination. A shared `PaginationQueryDto` base class in `backend-infra-database` provides `page` and `limit` with computed `take`/`skip` getters:

```typescript
export class PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc' = 'desc';

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
  get take(): number {
    return this.limit ?? 20;
  }
}
```

Every list endpoint returns `PaginatedResponse<T>`:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    take: number;
    skip: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

- `defaultTake: 20`, `maxTake: 100` enforced in DTOs.
- `hasNextPage` / `hasPreviousPage` computed by the service from `total`, `take`, `skip`.
- `PaginatedResponse` interface lives in `shared/types`. `PaginationQueryDto` stays in `backend/infra/database`.

## Audit Logging

Backoffice write operations use the `@AuditLog()` decorator for declarative audit logging:

```typescript
@Post()
@AuditLog({ action: 'Create', resource: 'MenuItem' })
async createOne(@CurrentAbility() ability: AppAbility, @Body() dto: CreateMenuItemDto): Promise<GetMenuItemDto> {
  const item = await this.menuItemsService.createOne(ability, CreateMenuItemDto.toInput(dto));
  return GetMenuItemDto.toDto(item);
}

@Patch(':id')
@AuditLog({ action: 'Update', resource: 'MenuItem', captureDifferences: true, entityIdParam: 'id' })
async updateOneById(@CurrentAbility() ability: AppAbility, @Param('id') id: string, @Body() dto: UpdateMenuItemDto): Promise<GetMenuItemDto> {
  const item = await this.menuItemsService.updateOne(ability, { id }, UpdateMenuItemDto.toInput(dto));
  return GetMenuItemDto.toDto(item);
}
```

- Implemented as a NestJS interceptor that reads `@AuditLog()` metadata.
- The interceptor extracts user and company from the request context — services do not need to pass user for audit purposes.
- Action strings align with CASL action naming (plain verbs).
- Lives in `backend-identity-audit`. Other sub-modules import the decorator only.
- Sensitive fields (`passwordHash`, refresh tokens, OTP codes) are stripped from diffs via `globalExcludeFields`.

## Other Conventions

- Swagger via `@nestjs/swagger` decorators on DTO classes.
- `AuthenticationGuard` is a global `APP_GUARD` — all routes require authentication by default. Use `@Public()` to skip (no public endpoints today).
- Interceptors for response transformation (pagination envelope).
- Environment variables via NestJS `ConfigModule`. **Never read `process.env` directly.**
- Tenant context set via `TenantContextMiddleware` at request start. Services do NOT manually filter by `company_id` — RLS handles it. Services DO filter by `shop_id` via CASL `mergeConditionsIntoWhere`.
- WebSocket gateways use `WsJwtGuard` for socket authentication. Rooms named `kitchen:shop:{shopId}`.

## Database Conventions (Prisma)

The `database-engineer` agent owns `.prisma` files. Backend engineers consume the generated client but **never edit schema files directly**.

### Schema Layout

```text
libs/backend/infra/database/src/prisma/schema/
  schema.prisma              # datasource + generator config only
  identity.prisma            # Company, User, UserDeviceInfo, LogEvent, audit/auth tables, BusinessType, PaymentMethod, CompanyInfo* (4 config enums)
  catalog.prisma             # Shop, Category, MenuItem, MenuAddon, MenuAddonOption, ShopCategory, ShopMenuItem, ShopMenuAddon, ShopMenuAddonOption, ItemPurchaseCount, UserShopItemOrder
  ordering.prisma            # Cart, CartItem, CartItemOption, Order, UserShopKitchenSettings
  payment.prisma             # CompanyPaymentProviderAccount
  operations.prisma          # ShopDiscount, ShopDiscountMenuItem, Waste
  integrations.prisma        # CompanyAccountingConnection, PlatformAccountingConnection, OrderSyncLog
```

**No `config.prisma` file.** The 4 config enum tables live in `identity.prisma` alongside the `Company` model they describe. Moving a model between `.prisma` files is metadata-only in Prisma terms — no SQL is generated for the move. Verify with `prisma migrate diff` before committing if uncertain.

**`Shop` lives in `catalog.prisma`**, not `operations.prisma`. See `domain-model.md` for the rationale.

- One `.prisma` file per domain. `schema.prisma` contains only `datasource` and `generator` blocks.
- Cross-domain relations work via `prismaSchemaFolder` — Prisma merges all files before generating the client.
- The `backend/infra/database` lib owns the Prisma client, schema files, migrations, seed scripts, tenant helpers, and RLS utilities.

### Migrations

- Generated via `npx prisma migrate dev --name {snake_case}` and stored in `libs/backend/infra/database/src/prisma/migrations/`.
- Production migrations run as a Cloud Run Job (`prisma migrate deploy`), not at boot.
- Prisma client is generated and re-exported from `backend/infra/database` barrel.

### Naming

- Prisma models: `PascalCase` (e.g., `MenuItem`)
- Prisma fields: `camelCase` (e.g., `menuItemId`)
- DB tables: `snake_case` via `@@map("menu_item")`
- DB columns: `snake_case` via `@map("menu_item_id")`
- **Always use `@@map` and `@map`** to preserve legacy table/column names from Tappd.
- All models have:

  ```prisma
  id        String   @id @default(uuid()) @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  ```

### Multi-Tenancy

- All multi-tenant models have `companyId String @map("company_id") @db.Uuid` with RLS policy.
- Shop-scoped models additionally have `shopId String @map("shop_id") @db.Uuid`.
- RLS policy created per multi-tenant table in migration files (raw SQL appended to the Prisma-generated migration).
- Composite indexes include `company_id` (and `shop_id` where applicable) as the leading column.
- Three PostgreSQL roles managed in migrations:
  - `app_tenant` — RLS enforced, full CRUD (scoped to one company). Used by `PrismaService`.
  - `app_public` — `BYPASSRLS`, read-only. Reserved for future use.
  - `app_system` — `BYPASSRLS`, full CRUD. Used by `SystemPrismaService` (when introduced) for `SUPER_ADMIN` operations only.

### Relations

- Relations are explicit via `@relation`. Use referential actions (`onDelete`, `onUpdate`).
- Use `prisma.$transaction()` for multi-model writes (especially cart → order → payment flows).

### Access Pattern

- The default `PrismaService` connects as `app_tenant`. Tenant context is set automatically by the Proxy from `TenantContextStore`.
- For `SUPER_ADMIN` operations that bypass RLS (when introduced), use `SystemPrismaService` — it must only be injected in services where `AuthorizationService.requirePermission()` verifies `SUPER_ADMIN` ability.
- **Never use `$queryRawUnsafe` with user input.**
