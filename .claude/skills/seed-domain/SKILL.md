---
name: seed-domain
description: Generate or extend the seed script with realistic test data for a domain. Owned by database-engineer.
argument-hint: <domain>
---

# Seed Domain

Add seed data for a domain to `libs/backend/infra/database/src/prisma/seed/`.

**Owner:** `database-engineer` agent.

**Argument:**
- `$1` — domain (`identity`, `catalog`, `ordering`, `payment`, `operations`, `integrations`)

## Pre-flight checks

1. Read the current seed script structure
2. Read `.claude/rules/domain-model.md` to understand which entities live in the domain
3. Read the relevant `.prisma` file(s) to understand the schema
4. Confirm migrations are up to date

## Steps

1. **Generate seed data** with these characteristics:
   - **At least 2 companies** (multi-tenancy testing requires at least 2 tenants)
   - **At least 2-3 shops per company** (two-level tenancy testing)
   - **Realistic data:**
     - English + Arabic content (`nameEn`, `nameAr`) for catalog entities
     - GBP amounts in pence (integers): £15.00 = `1500`
     - UK addresses (London, Manchester, Birmingham) for shops
     - UK phone format: `+44 7XXX XXXXXX`
   - **Deterministic UUIDs** for test reproducibility (use a fixed string-to-uuid function)
   - **Idempotent inserts** via `prisma.entity.upsert()`
   - **Wrap in `prisma.$transaction()`** for atomic seeding

2. **Domain-specific seed data:**

   | Domain | Suggested seed data |
   |---|---|
   | `identity` | 2 companies, 5-10 users per company spanning all 5 roles, 2-3 user-shop assignments |
   | `catalog` | 5-10 categories, 20-30 menu items, 5 menu addons with options, shop-level overrides for 5 items |
   | `ordering` | 10-20 orders per shop in various statuses (Pending, Confirmed, Completed, Cancelled) |
   | `payment` | 1 Stripe Connect account per company (mocked), 1 Terminal device per shop |
   | `operations` | 3-5 active discounts per shop, 5-10 waste records |
   | `integrations` | 1 platform-level Xero connection, 1 per-company Xero connection, sync log entries |

3. **Add a seed function** named `seed${Domain}(prisma: PrismaClient)` in `libs/backend/infra/database/src/prisma/seed/${domain}.seed.ts`:
   ```typescript
   import { PrismaClient } from '@prisma/client';

   export async function seedCatalog(prisma: PrismaClient): Promise<void> {
     // Categories
     const categoryFood = await prisma.category.upsert({
       where: { id: '00000000-0000-0000-0000-000000000101' },
       update: {},
       create: {
         id: '00000000-0000-0000-0000-000000000101',
         companyId: '00000000-0000-0000-0000-000000000001',
         nameEn: 'Food',
         nameAr: 'طعام',
         sortOrder: 1,
       },
     });
     // ... more entities
   }
   ```

4. **Update the main seed script** at `libs/backend/infra/database/src/prisma/seed/index.ts` to call your new domain seed:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   import { seedIdentity } from './identity.seed';
   import { seedCatalog } from './catalog.seed';
   // ...

   async function main() {
     const prisma = new PrismaClient();
     await prisma.$transaction(async (tx) => {
       await seedIdentity(tx);
       await seedCatalog(tx);
       // ...
     });
   }
   ```

5. **Note on RLS context:**
   - The seed script runs as `app_system` (RLS-bypassing) so it can insert across companies
   - Or it runs without setting `app.current_company`, which means RLS-enforced inserts will fail — use `app_system` for seeds
   - The connection role for the seed script must be `app_system`

6. **Test the seed:**
   ```bash
   npx prisma db seed
   ```

7. **Verify the seed is idempotent** by running it twice — should produce the same database state.

## Hard rules

- **Use `upsert()`** for idempotency, not `create()` — the seed must be safely re-runnable
- **Deterministic UUIDs** — use a fixed scheme (e.g., `00000000-0000-0000-0000-000000{NNN}`) so test references are stable
- **Monetary amounts in pence** — never floats or decimals
- **Bilingual content** — every catalog entity has `nameEn` and `nameAr`
- **Multi-company setup** — at least 2 companies so multi-tenancy works
- **Two-level hierarchy** — companies have multiple shops, RLS isolates by company, CASL isolates by shop
- **Use `app_system` connection** for seed runs — bypasses RLS

## Hand-off

After seeding:
- Verify queries return seeded data correctly via `psql` or a quick smoke test
- Document the seed UUIDs in `libs/backend/infra/database/src/prisma/seed/README.md` so other agents can reference them in manual testing
