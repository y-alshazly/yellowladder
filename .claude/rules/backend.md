---
description: Backend NestJS conventions — file naming, modules, controllers, DTOs, repositories, domain events, RBAC, multi-tenancy, Prisma
alwaysApply: false
paths:
  - 'libs/backend/**'
  - 'apps/core-service/**'
---

# Backend Conventions (NestJS)

## File Naming

All files use `kebab-case.{suffix}.ts`:

| File Type      | Suffix               | Example                        |
| -------------- | -------------------- | ------------------------------ |
| Module         | `.module.ts`         | `menu-items.module.ts`         |
| Controller     | `.controller.ts`     | `menu-items.controller.ts`     |
| Service        | `.service.ts`        | `menu-items.service.ts`        |
| Repository     | `.repository.ts`     | `menu-items.repository.ts`     |
| Event handler  | `.handler.ts`        | `payment-completed.handler.ts` |
| Field registry | `-field-registry.ts` | `menu-items-field-registry.ts` |
| DTO            | `.dto.ts`            | `create-menu-item.dto.ts`      |
| Domain event   | `.event.ts`          | `order-confirmed.event.ts`     |
| Guard          | `.guard.ts`          | `authentication.guard.ts`      |
| Middleware     | `.middleware.ts`     | `tenant-context.middleware.ts` |
| Interceptor    | `.interceptor.ts`    | `audit-log.interceptor.ts`     |
| Decorator      | `.decorator.ts`      | `current-user.decorator.ts`    |
| Gateway        | `.gateway.ts`        | `kitchen.gateway.ts`           |

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
  @RequirePermission(Permissions.MenuItemsCreate)
  @AuditLog({ action: 'Create', resource: 'MenuItem' })
  async createOne(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentCompany() companyId: string,
    @Body() dto: CreateMenuItemDto,
  ): Promise<GetMenuItemDto> {
    const menuItem = await this.menuItemsService.createOne(
      user,
      companyId,
      CreateMenuItemDto.toInput(dto),
    );
    return GetMenuItemDto.toDto(menuItem);
  }

  @Get()
  @ApiMenuItems('getMany')
  @RequirePermission(Permissions.MenuItemsRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetMenuItemsQueryDto,
  ): Promise<PaginatedResponse<GetMenuItemDto>> {
    const { data, meta } = await this.menuItemsService.getMany(user, query);
    return { data: data.map((item) => GetMenuItemDto.toDto(item)), meta };
  }

  @Get(':id')
  @ApiMenuItems('getOneById')
  @RequirePermission(Permissions.MenuItemsRead)
  async getOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const menuItem = await this.menuItemsService.getOne(user, { id });
    return GetMenuItemDto.toDto(menuItem);
  }
}
```

- `@CurrentUser()` is passed to every service method. It carries `{ userId, companyId, role, shopIds }` from the JWT — everything the service needs for authorization and auditing.
- `@CurrentCompany()` extracts `companyId` from the JWT (set by `TenantContextMiddleware`). It is equivalent to `user.companyId`; keep it for clarity when the service takes `companyId` as a separate argument for insert payloads.
- `@RequirePermission(...)` is an **optional convenience**: it works with a global `RolesGuard` to reject obviously unauthorized HTTP calls early. Services MUST still call `AuthorizationService.requirePermission(user, permission)` internally, because the guard is skipped for non-HTTP entry points (event handlers, scheduled jobs).
- `@AuditLog()` is a declarative decorator on write endpoints.
- `ParseUUIDPipe` on all `:id` route params for input validation.
- Controllers call `CreateMenuItemDto.toInput(dto)` to convert request DTOs to named repository input types.
- Controllers call `GetMenuItemDto.toDto(entity)` to convert service return values to response DTOs.
- Service methods accept `where: Prisma.{Entity}WhereInput` (not bare `id: string`), so controllers pass `{ id }` objects. The service then extends this WHERE with `AuthorizationService.scopeWhereToUserShops(user, where)` when the entity is shop-scoped.

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
  (Prisma      (Prisma entity)     (GetMenuItemDto)
   entity)
```

| Boundary             | Input                                                         | Output                           |
| -------------------- | ------------------------------------------------------------- | -------------------------------- |
| Controller → Service | Named repo type (e.g., `CreateMenuItemInput` via `toInput()`) | Prisma entity                    |
| Service → Repository | Named repo type (e.g., `CreateMenuItemInput`)                 | Prisma entity                    |
| Controller → HTTP    | —                                                             | `GetMenuItemDto` (via `toDto()`) |

Field-level redaction (hiding attributes from lower-privilege roles) is explicit in the service: delete the fields on the returned entity before handing it to the controller, using a small `if (user.role === Role.X)` branch or a dedicated helper. There is no automatic filtering.

## Client-Generated UUIDs and Idempotency

Yellow Ladder is **online-only today**, but two cheap conventions are baked in from day one so a future offline-mode retrofit stays cheap (and so the UX is more resilient on flaky networks right now). These are not offline code — they're just how writes are shaped.

### Client-Generated UUIDs for User-Created Entities

The following entities use **client-generated UUIDs** instead of server-generated ones: `Cart`, `CartItem`, `CartItemOption`, `Order`, `OrderItem`, `OrderItemOption`, `Waste`.

- The client (mobile) generates the UUID via `crypto.randomUUID()` (on React Native, install `react-native-get-random-values` and import it once at app root so `crypto.randomUUID()` works) and sends it in the create payload.
- The create DTO adds an `id: string` field validated with `@IsUUID()`.
- The named repository input type includes `id`.
- The Prisma model keeps `id String @id @default(uuid()) @db.Uuid` — the `@default(uuid())` stays as a safety net for server-only writes (seed scripts, domain event handlers), but the normal HTTP create path passes the client's UUID.

**Why:** the client can reference the entity by its final permanent ID the moment it's created — useful for multi-cart switching, receipt printing, kitchen-display cross-references, and (if offline mode is ever added) trivial sync-queue replay with no local-ID-to-real-ID remapping.

**NOT in scope** (these stay server-generated):

- Config enum tables: `BusinessType`, `PaymentMethod`, company-info lookups
- `User`, `Company`, `Shop`
- `MenuItem`, `Category`, `MenuAddon`, `MenuAddonOption` (admin-managed, not end-user-created)
- `ShopCategory`, `ShopMenuItem`, `ShopMenuAddon`, `ShopMenuAddonOption` (admin-managed shop overrides)
- `ShopDiscount`, `ShopDiscountMenuItem` (admin-managed)
- `CompanyPaymentProviderAccount`, `CompanyAccountingConnection`, `PlatformAccountingConnection`
- `LogEvent`, `OrderSyncLog`, `StripeWebhookEvent`, `UserDeviceInfo` (system-generated)
- `UserShopKitchenSettings`, `UserShopItemOrder`, `ItemPurchaseCount` (system-managed)

### Idempotency-Key on Mutation Endpoints

All `POST` endpoints for the user-created entities listed above accept an `Idempotency-Key` HTTP header. The client passes the entity's UUID as the key — they're the same value, no separate key generation.

- The backend dedupes duplicate requests so that the same key arriving twice does NOT create a duplicate. The second request returns the original response.
- **Dedupe strategy (primary):** rely on the Prisma unique constraint on `id`. Catch `Prisma.PrismaClientKnownRequestError` with code `P2002` in the service and return the existing entity via `repository.findOneOrThrow({ id: input.id })`.
- **Dedupe strategy (fallback, for future endpoints that accept Idempotency-Key without client UUIDs):** a small `IdempotencyKey` model + helper lives in `libs/backend/infra/database` with `(user_id, key)` unique and a 24-hour TTL.

**Why this is worth it even today (online-only):**

- Protects against double-taps on the POS, retried requests on network hiccups, and React Native's "request timeout but server actually succeeded" scenarios — all common during a busy shift
- ~5 lines per create method (one try/catch + one re-fetch), zero new infra to adopt
- Unblocks a cheap offline retrofit later — the sync-queue retry becomes "just resend", not a custom dedupe layer

**Example service create flow for a client-UUID entity:**

```typescript
async createOne(user: AuthenticatedUser, input: CreateOrderInput) {
  this.authorizationService.requirePermission(user, Permissions.OrdersCreate);
  this.authorizationService.assertShopAccess(user, input.shopId);
  try {
    return await this.repository.createOne(input);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Idempotent retry — the client sent the same UUID twice. Return the existing entity.
      return this.repository.findOneOrThrow({ id: input.id });
    }
    throw error;
  }
}
```

## DTO Naming

| Concern        | `shared/types` Interface | Backend DTO Class      |
| -------------- | ------------------------ | ---------------------- |
| Create request | `CreateMenuItemRequest`  | `CreateMenuItemDto`    |
| Update request | `UpdateMenuItemRequest`  | `UpdateMenuItemDto`    |
| Response       | `GetMenuItemResponse`    | `GetMenuItemDto`       |
| Query params   | —                        | `GetMenuItemsQueryDto` |

## Request DTOs (class-validator)

Request DTOs are classes with class-validator decorators that implement the corresponding `shared/types` interface. Each request DTO has a `static toInput()` method that returns the named repository input type:

```typescript
import { IsString, IsUUID, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMenuItemRequest } from '@yellowladder/shared-types';
import type { CreateMenuItemInput } from '../menu-items.repository';

export class CreateMenuItemDto implements CreateMenuItemRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameDe: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameFr: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @IsNumber()
  basePrice: number;

  static toInput(dto: CreateMenuItemDto): CreateMenuItemInput {
    return {
      nameEn: dto.nameEn,
      nameDe: dto.nameDe,
      nameFr: dto.nameFr,
      categoryId: dto.categoryId,
      basePrice: dto.basePrice,
    };
  }
}
```

- Every request DTO class `implements` its `shared/types` interface.
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
  @ApiProperty() nameDe: string;
  @ApiProperty() nameFr: string;
  @ApiProperty() basePrice: number;

  static toDto(entity: MenuItem): GetMenuItemDto {
    const dto = new GetMenuItemDto();
    dto.id = entity.id;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
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

**`findOne` accepts WHERE input:** `findOne(where: Prisma.MenuItemWhereInput)` — not `findOne(id: string)`. This lets the service extend the WHERE with `AuthorizationService.scopeWhereToUserShops(user, where)` before passing it through.

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

## Authorization (RBAC — service layer)

- Authorization is handled in **services**, not guards. This ensures it runs regardless of entry point (HTTP, events, scheduled jobs, internal calls).
- Controllers pass the authenticated user to every service method via `@CurrentUser()`. The `AuthenticatedUser` type is `{ userId, companyId, role, shopIds }` — everything the service needs for authorization and auditing.
- Services inject `AuthorizationService` from `@yellowladder/backend-identity-authorization` and call:
  - `requirePermission(user, permission)` — throws `ForbiddenException` if the user's role does not include the permission
  - `hasPermission(user, permission)` — boolean check for conditional logic
  - `scopeWhereToUserShops(user, baseWhere)` — appends `shopId IN [...]` for shop-bounded roles; no-op for `COMPANY_ADMIN` / `SUPER_ADMIN`
  - `assertShopAccess(user, shopId)` — throws if the shop is not in `user.shopIds` (for single-shop write paths)
  - `assertCompanyAccess(user, companyId)` — throws if the user is not attached to the target company (only `SUPER_ADMIN` may cross companies)
- Permission naming: `{resource}:{action}` strings declared in `libs/shared/types` as an `as const` object (e.g., `Permissions.MenuItemsCreate = 'menu-items:create'`). No TypeScript `enum`.
- When `user` is `undefined` (system/internal calls triggered by scheduled jobs or replay), the service MUST document the bypass explicitly. Prefer a dedicated `SystemContext` argument over optional user parameters, so internal call-sites do not accidentally skip authorization.
- **Controller-level `@RequirePermission(...)` + global `RolesGuard` is allowed and encouraged** as an early-rejection convenience. The service layer remains the ultimate authority because non-HTTP entry points (event handlers, scheduled jobs) bypass the guard.

### 4-Step Service Flow

Every service method that touches data must follow this flow:

```text
Create: requirePermission → (assertShopAccess if shop-scoped) → repository.create
Read:   requirePermission → scopeWhereToUserShops → repository.find
Update: requirePermission → scopeWhereToUserShops (fetch) → (optional: redact fields for low-privilege roles) → repository.update
Delete: requirePermission → scopeWhereToUserShops (fetch) → repository.delete
```

```typescript
async createOne(user: AuthenticatedUser, companyId: string, input: CreateMenuItemInput) {
  this.authorizationService.requirePermission(user, Permissions.MenuItemsCreate);
  // MenuItem is company-level (not shop-scoped), so no shop assertion needed here.
  const menuItem = await this.repository.createOne({ ...input, companyId });
  return menuItem;
}

async getMany(user: AuthenticatedUser, query: GetMenuItemsQueryDto) {
  this.authorizationService.requirePermission(user, Permissions.MenuItemsRead);
  const baseWhere = buildWhereFromQuery(query);
  // MenuItem itself is company-level, so scopeWhereToUserShops is a no-op.
  // For shop-scoped entities (ShopMenuItem, Order, Cart, Waste), this adds shopId IN user.shopIds.
  const where = this.authorizationService.scopeWhereToUserShops(user, baseWhere);
  const { items, total } = await this.repository.findMany(where, query.skip, query.take, query.orderBy);
  return { data: items, meta: { total, take: query.take, skip: query.skip } };
}

async updateOne(user: AuthenticatedUser, where: Prisma.MenuItemWhereInput, input: UpdateMenuItemInput) {
  this.authorizationService.requirePermission(user, Permissions.MenuItemsUpdate);
  const scopedWhere = this.authorizationService.scopeWhereToUserShops(user, where);
  const existing = await this.repository.findOne(scopedWhere);
  if (!existing) {
    throw new BusinessException(
      CatalogMenuItemsErrors.MenuItemNotFound,
      'Menu item not found',
      HttpStatus.NOT_FOUND,
    );
  }
  // Explicit field-level redaction for lower-privilege roles:
  if (user.role === Role.EMPLOYEE) {
    delete (input as Partial<UpdateMenuItemInput>).basePrice;
  }
  return this.repository.updateOne(existing.id, input);
}
```

**Common violations to avoid:**

- Forgetting `requirePermission` — an endpoint is reachable by every authenticated user.
- Forgetting `scopeWhereToUserShops` for shop-scoped reads — `SHOP_MANAGER` can see other shops' data.
- Forgetting `assertShopAccess` on single-shop write paths — `SHOP_MANAGER` can write outside their shops.
- Using `manage` as a permission action instead of specific verbs (`create`, `read`, `update`, `delete`). Keep `manage` for rare umbrella permissions; prefer specific verbs.
- Passing `companyId` from client input without calling `assertCompanyAccess(user, companyId)` — cross-tenant write.
- Forgetting the `@RequirePermission(...)` decorator on controllers (not a bug by itself because the service layer catches it, but it delays the rejection and wastes work).

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
@RequirePermission(Permissions.MenuItemsCreate)
@AuditLog({ action: 'Create', resource: 'MenuItem' })
async createOne(
  @CurrentUser() user: AuthenticatedUser,
  @Body() dto: CreateMenuItemDto,
): Promise<GetMenuItemDto> {
  const item = await this.menuItemsService.createOne(user, user.companyId, CreateMenuItemDto.toInput(dto));
  return GetMenuItemDto.toDto(item);
}

@Patch(':id')
@RequirePermission(Permissions.MenuItemsUpdate)
@AuditLog({ action: 'Update', resource: 'MenuItem', captureDifferences: true, entityIdParam: 'id' })
async updateOneById(
  @CurrentUser() user: AuthenticatedUser,
  @Param('id') id: string,
  @Body() dto: UpdateMenuItemDto,
): Promise<GetMenuItemDto> {
  const item = await this.menuItemsService.updateOne(user, { id }, UpdateMenuItemDto.toInput(dto));
  return GetMenuItemDto.toDto(item);
}
```

- Implemented as a NestJS interceptor that reads `@AuditLog()` metadata.
- The interceptor extracts user and company from the request context — services do not need to pass user for audit purposes.
- Action strings on `@AuditLog` are plain verbs (`Create`, `Read`, `Update`, `Delete`) for human-readable logs and line up with the verb portion of the RBAC permission string.
- Lives in `backend-identity-audit`. Other sub-modules import the decorator only.
- Sensitive fields (`passwordHash`, refresh tokens, OTP codes) are stripped from diffs via `globalExcludeFields`.

## Other Conventions

- Swagger via `@nestjs/swagger` decorators on DTO classes.
- `AuthenticationGuard` is a global `APP_GUARD` — all routes require authentication by default. Use `@Public()` to skip (no public endpoints today).
- Interceptors for response transformation (pagination envelope).
- Environment variables via NestJS `ConfigModule`. **Never read `process.env` directly.**
- Tenant context set via `TenantContextMiddleware` at request start. Services do NOT manually filter by `company_id` — RLS handles it. Services DO filter by `shop_id` via `AuthorizationService.scopeWhereToUserShops(user, where)`.
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
- For `SUPER_ADMIN` operations that bypass RLS (when introduced), use `SystemPrismaService` — it must only be injected in services where `AuthorizationService.requirePermission()` first verifies a `SUPER_ADMIN`-gated permission.
- **Never use `$queryRawUnsafe` with user input.**
