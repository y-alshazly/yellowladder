-- ============================================================================
-- Yellow Ladder — init Postgres roles
--
-- Runs BEFORE any feature migration. Creates the three application roles used
-- throughout Yellow Ladder's multi-tenancy model:
--
--   app_tenant — RLS enforced. Default role used by PrismaService. Queries
--                are automatically filtered by `current_setting('app.current_company')::uuid`.
--   app_public — BYPASSRLS, SELECT-only. Reserved for future public read
--                endpoints if Yellow Ladder ever adds them. NOT used in Feature 01.
--   app_system — BYPASSRLS, full CRUD. Used by SystemPrismaService for
--                SUPER_ADMIN operations only. Must be gated by RBAC in
--                the service layer via AuthorizationService.requirePermission().
--
-- These roles are NOLOGIN — the application connects as `postgres` (or its
-- Cloud SQL equivalent) and uses `SET LOCAL ROLE app_tenant` inside a
-- transaction to adopt the appropriate role for each request.
--
-- CRITICAL: The application's login role (the user that DATABASE_URL connects
-- as) MUST be a member of `app_tenant` for `SET LOCAL ROLE app_tenant` inside
-- `PrismaService.runInTenantTransaction` to succeed. Without this grant,
-- `FORCE ROW LEVEL SECURITY` on the tenancy tables will reject every query
-- because the active role never matches the `TO app_tenant` policy. The DO
-- block below grants `current_user` (whichever login role runs the migration)
-- membership in all three abstract roles so it can `SET LOCAL ROLE` into any
-- of them at request time.
--
-- Idempotent: safe to re-apply. Uses DO blocks to check existence first.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_tenant') THEN
    CREATE ROLE app_tenant NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_public') THEN
    CREATE ROLE app_public NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_system') THEN
    CREATE ROLE app_system NOLOGIN BYPASSRLS;
  END IF;
END $$;

-- Allow the migration runner (postgres) to SET ROLE to any of these.
GRANT app_tenant TO postgres;
GRANT app_public TO postgres;
GRANT app_system TO postgres;

-- Grant the application's runtime login role (whatever DATABASE_URL points at)
-- membership in all three abstract roles so `SET LOCAL ROLE app_tenant` inside
-- `PrismaService.runInTenantTransaction` succeeds.
--
--   - In development this is typically `postgres` (superuser — already implicitly
--     a member of every role, so the GRANT is a no-op).
--   - In staging / production this is a dedicated application login role (e.g.
--     `yl_app`) — the GRANT is essential for the runtime to switch into
--     `app_tenant`. Without it, `SET LOCAL ROLE app_tenant` raises
--     `permission denied to set role "app_tenant"`.
--
-- `current_user` resolves to whichever login role is running this migration,
-- which is the same role DATABASE_URL connects as in that environment.
-- Idempotent: wrapping in EXCEPTION blocks swallows duplicate-grant errors on
-- re-runs and logs a notice if we lack privilege (e.g. the migration role is
-- non-superuser and cannot GRANT its own memberships — admin must run manually).
DO $$
BEGIN
  EXECUTE format('GRANT app_tenant TO %I', current_user);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not grant app_tenant to %: insufficient privilege. Grant manually.', current_user;
END
$$;

DO $$
BEGIN
  EXECUTE format('GRANT app_public TO %I', current_user);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not grant app_public to %: insufficient privilege. Grant manually.', current_user;
END
$$;

DO $$
BEGIN
  EXECUTE format('GRANT app_system TO %I', current_user);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not grant app_system to %: insufficient privilege. Grant manually.', current_user;
END
$$;

-- Default usage on the public schema.
GRANT USAGE ON SCHEMA public TO app_tenant;
GRANT USAGE ON SCHEMA public TO app_public;
GRANT USAGE ON SCHEMA public TO app_system;
