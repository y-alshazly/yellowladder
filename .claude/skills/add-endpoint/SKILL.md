---
name: add-endpoint
description: Add a new REST endpoint (controller method, service method, repository method, DTOs, shared/types interface) to an existing backend sub-module. Owned by backend-engineer.
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

1. **Update `libs/shared/types/src/$1/$2.types.ts`** with the new request and response interfaces:
   - `Create${Entity}Request` / `Update${Entity}Request` for write endpoints
   - `Get${Entity}Response` / `Get${Entities}Response` for read endpoints
   - `PaginatedResponse<Get${Entity}Response>` for list endpoints

2. **Update or create the request DTO** at `libs/backend/$1/$2/src/dtos/`:
   - File name: `${action-kebab}-${entity-kebab}.dto.ts` (e.g., `create-menu-item.dto.ts`)
   - Class name: `${Action}${Entity}Dto`
   - `implements` the shared/types Request interface
   - `[key: string]: unknown` index signature for CASL
   - `static toInput(dto)` returning the named repository input type
   - class-validator decorators on every field
   - `@ApiProperty()` on every field
   - See `.claude/examples/canonical-dto.ts`

3. **Update or create the response DTO**:
   - File name: `get-${entity-kebab}.dto.ts`
   - Class name: `Get${Entity}Dto`
   - `implements` the shared/types Response interface
   - `static toDto(entity)` factory mapping from Prisma entity

4. **Add the repository method** in `${submodule}.repository.ts`:
   - Use named input types (e.g., `CreateMenuItemInput`)
   - Use Prisma's generated types for parameters (`Prisma.MenuItemWhereInput`, etc.)
   - For `findOne`, accept `where: Prisma.${Entity}WhereInput` (full WHERE for CASL pass-through)
   - For `findMany`, accept explicit `where, skip, take, orderBy` parameters
   - For status transitions, dedicated methods (`activate()`, `cancel()`) — not generic `update`

5. **Add the service method** in `${submodule}.service.ts` following the **5-method service flow**:

   **Create:**
   ```
   requirePermission → ensureFieldsPermitted → ensureConditionsMet → repository.create → pickPermittedFields
   ```

   **Read one:**
   ```
   requirePermission → mergeConditionsIntoWhere → repository.findOne → pickPermittedFields
   ```

   **Read many:**
   ```
   requirePermission → buildWhere → mergeConditionsIntoWhere → repository.findMany → pickPermittedFields (each)
   ```

   **Update:**
   ```
   requirePermission → mergeConditionsIntoWhere → repository.findOne → ensureFieldsPermitted → repository.update → pickPermittedFields
   ```

   **Delete:**
   ```
   requirePermission → mergeConditionsIntoWhere → repository.findOne → repository.delete
   ```

   **Status transition:**
   ```
   requirePermission → mergeConditionsIntoWhere → fetch → validate state → repository.dedicatedMethod → publish domain event → pickPermittedFields
   ```

6. **Add the controller method** in `${submodule}.controller.ts`:
   - Thin — calls `Dto.toInput()`, delegates to service, calls `Dto.toDto()` on the return
   - Decorators: `@CurrentAbility()`, `@CurrentCompany()` (if needed), `@AuditLog()` for writes
   - `ParseUUIDPipe` on `:id` params
   - Pass `{ id }` object (not bare string) to enable CASL `mergeConditionsIntoWhere`
   - For lists, return `PaginatedResponse<Get${Entity}Dto>`

7. **Add the Swagger decorator** in `${submodule}.swagger.ts` (only if the file exists or this is the 3rd+ endpoint):
   - Add a method entry to `methodDecorators`
   - Add the method name to the `${Submodule}Method` union type

8. **Update the barrel** at `src/index.ts` if any new public exports were added (typically not — DTOs are internal).

9. **Verify forbidden patterns** are not introduced:
   - No `any` type
   - No default exports
   - No raw `$queryRawUnsafe`
   - No hardcoded OTP `886644`
   - No direct cross-domain service imports (use domain events for writes)

## Hard rules

- **Authorization in services, never controllers** — `@CurrentAbility()` is just a parameter pass-through
- **`/api/v1/` prefix** is global — never hardcode it in `@Controller()` or routes
- **No tests scaffolded** — testing is deferred
- **DTOs implement shared/types interfaces** — single source of truth across backend and frontend

## Hand-off

After the endpoint is implemented:
- If a new backend domain event was published, add a handler in the consuming sub-module via the `add-event-handler` skill
- Notify `web-engineer` and `mobile-engineer` so they can update RTK Query slices in `shared/api`
- Run `code-reviewer` skill on the changes before committing
