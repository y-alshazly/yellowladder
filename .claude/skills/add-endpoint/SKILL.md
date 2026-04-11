---
name: add-endpoint
description: Add a new REST endpoint (controller method, service method, repository method, DTOs, shared/types interface, permission constant) to an existing backend sub-module. Owned by backend-engineer.
argument-hint: <domain> <submodule> <HTTP-method> <action>
---

# Add Endpoint

Add a new REST endpoint to an existing backend sub-module, following the Yellow Ladder NestJS conventions.

**Owner:** `backend-engineer` agent.

**Arguments:**

- `$1` — domain (e.g., `catalog`)
- `$2` — sub-module (e.g., `menu-items`)
- `$3` — HTTP method (`POST`, `GET`, `PATCH`, `DELETE`, or status transition like `POST :id/activate`)
- `$4` — action (e.g., `createOne`, `getMany`, `getOneById`, `updateOneById`, `deleteOneById`, `activate`, `cancel`)

## Pre-flight checks

1. Read the existing sub-module structure at `libs/backend/$1/$2/`
2. Read `.claude/rules/backend.md` §Method Naming for the verb conventions
3. Read `.claude/examples/canonical-controller.ts` and `.claude/examples/canonical-service.ts` for reference patterns
4. Confirm the endpoint follows the `/api/v1/` versioned pattern (the global prefix in `apps/core-service/src/main.ts`)

## Steps

1. **Add a permission constant** to `libs/shared/types/src/auth/permissions.constants.ts`:
   - Add a new entry to the `Permissions` `as const` object, keyed in PascalCase (e.g., `MenuItemsCreate`), with the string value `'{resource}:{action}'` (e.g., `'menu-items:create'`).
   - Keep entries alphabetically grouped by resource.
   - Wire the new permission to the appropriate role(s) in `RolePermissionRegistry`.
   - Permissions are plain `{resource}:{action}` strings — no TypeScript `enum`.

2. **Update `libs/shared/types/src/$1/$2.types.ts`** with the new request and response interfaces:
   - `Create${Entity}Request` / `Update${Entity}Request` for write endpoints
   - `Get${Entity}Response` / `Get${Entities}Response` for read endpoints
   - `PaginatedResponse<Get${Entity}Response>` for list endpoints

3. **Update or create the request DTO** at `libs/backend/$1/$2/src/dtos/`:
   - File name: `${action-kebab}-${entity-kebab}.dto.ts` (e.g., `create-menu-item.dto.ts`)
   - Class name: `${Action}${Entity}Dto`
   - `implements` the shared/types Request interface
   - `static toInput(dto)` returning the named repository input type
   - class-validator decorators on every field
   - `@ApiProperty()` on every field
   - DTOs do NOT need a `[key: string]: unknown;` index signature.
   - See `.claude/examples/canonical-dto.ts`

4. **Update or create the response DTO**:
   - File name: `get-${entity-kebab}.dto.ts`
   - Class name: `Get${Entity}Dto`
   - `implements` the shared/types Response interface
   - `static toDto(entity)` factory mapping from Prisma entity

5. **Add the repository method** in `${submodule}.repository.ts`:
   - Use named input types (e.g., `CreateMenuItemInput`)
   - Use Prisma's generated types for parameters (`Prisma.MenuItemWhereInput`, etc.)
   - For `findOne`, accept `where: Prisma.${Entity}WhereInput`
   - For `findMany`, accept explicit `where, skip, take, orderBy` parameters
   - For status transitions, dedicated methods (`activate()`, `cancel()`) — not generic `update`

6. **Add the service method** in `${submodule}.service.ts` following the **4-step RBAC service flow**:

   Every service method takes `user: AuthenticatedUser` as its first parameter, where
   `AuthenticatedUser = { userId, companyId, role, shopIds }`.

   **Create:**

   ```
   requirePermission(user, Permissions.XxxCreate)
     → assertShopAccess(user, input.shopId)  (if shop-scoped)
     → repository.create(input)
     → return Get${Entity}Dto.toDto(entity)
   ```

   **Read one:**

   ```
   requirePermission(user, Permissions.XxxRead)
     → const where = scopeWhereToUserShops(user, { id })  (if shop-scoped) OR { id }
     → repository.findOne(where)
     → return Get${Entity}Dto.toDto(entity)
   ```

   **Read many:**

   ```
   requirePermission(user, Permissions.XxxRead)
     → const where = scopeWhereToUserShops(user, buildWhere(query))
     → repository.findMany({ where, skip, take, orderBy })
     → return entities.map(Get${Entity}Dto.toDto)
   ```

   **Update:**

   ```
   requirePermission(user, Permissions.XxxUpdate)
     → const where = scopeWhereToUserShops(user, { id })
     → repository.findOne(where)  (verifies access)
     → (explicit field redaction per role if needed, e.g.
        `if (user.role === Role.EMPLOYEE) delete input.basePrice;`)
     → repository.update(id, input)
     → return Get${Entity}Dto.toDto(entity)
   ```

   **Delete:**

   ```
   requirePermission(user, Permissions.XxxDelete)
     → const where = scopeWhereToUserShops(user, { id })
     → repository.findOne(where)
     → repository.delete(id)
   ```

   **Status transition:**

   ```
   requirePermission(user, Permissions.XxxTransition)
     → const where = scopeWhereToUserShops(user, { id })
     → repository.findOne(where)
     → validate state machine
     → repository.dedicatedMethod()
     → publish domain event via DomainEventPublisher
     → return Get${Entity}Dto.toDto(entity)
   ```

   There is NO `ensureFieldsPermitted`, NO `pickPermittedFields`, NO `ensureConditionsMet`, NO
   `mergeConditionsIntoWhere`. Field-level restrictions are expressed as explicit per-role code in
   the service, keeping the RBAC flow simple and inspectable.

7. **Add the controller method** in `${submodule}.controller.ts`:
   - Thin — calls `Dto.toInput()`, delegates to service, calls `Dto.toDto()` on the return
   - Decorators: `@CurrentUser()` to receive the `AuthenticatedUser`, optional `@RequirePermission(Permissions.XxxYyy)` for early rejection via the global `RolesGuard`, `@AuditLog()` for writes
   - `ParseUUIDPipe` on `:id` params
   - Pass `user` (the full `AuthenticatedUser`) as the first argument to the service method
   - For lists, return `PaginatedResponse<Get${Entity}Dto>`

8. **Add the Swagger decorator** in `${submodule}.swagger.ts` (only if the file exists or this is the 3rd+ endpoint):
   - Add a method entry to `methodDecorators`
   - Add the method name to the `${Submodule}Method` union type

9. **Update the barrel** at `src/index.ts` if any new public exports were added (typically not — DTOs are internal).

10. **Verify forbidden patterns** are not introduced:
    - No `any` type
    - No default exports
    - No raw unsafe query helpers
    - No legacy hardcoded testing OTP
    - No direct cross-domain service imports (use domain events for writes)

## Hard rules

- **Authorization in services, never controllers** — the controller just forwards `@CurrentUser()` to the service. `@RequirePermission()` on the controller is an optional early rejection layer; the service still calls `requirePermission(user, ...)` itself.
- **`/api/v1/` prefix** is global — never hardcode it in `@Controller()` or routes
- **No tests scaffolded** — testing is deferred
- **DTOs implement shared/types interfaces** — single source of truth across backend and frontend
- **Every new endpoint needs a permission constant** in `libs/shared/types/src/auth/permissions.constants.ts` and a corresponding wiring in `RolePermissionRegistry`.

## Hand-off

After the endpoint is implemented:

- If a new backend domain event was published, add a handler in the consuming sub-module via the `add-event-handler` skill
- Notify `web-engineer` and `mobile-engineer` so they can update RTK Query slices in `shared/api` and gate UI with `<HasPermission permission={Permissions.XxxYyy}>`
- Run `code-reviewer` skill on the changes before committing
