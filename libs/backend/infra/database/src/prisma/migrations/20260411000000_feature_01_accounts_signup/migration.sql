-- ============================================================================
-- Yellow Ladder — Feature 01: Accounts & Sign-Up
--
-- Creates the Identity domain tables required for merchant onboarding:
--   - companies                (tenancy root — RLS enabled)
--   - company_primary_contacts (multi-tenant — RLS enabled)
--   - users                    (platform-global — NO RLS)
--   - user_device_info         (platform-global)
--   - otp_records              (platform-global)
--   - password_reset_tokens    (platform-global)
--   - email_verification_tokens (platform-global, reserved for future use)
--   - refresh_token_records    (platform-global)
--   - business_types           (platform-global reference data)
--   - business_categories      (platform-global reference data)
--   - annual_turnover_bands    (platform-global reference data)
--   - payment_methods          (platform-global reference data)
--
-- RLS scope (Feature 01):
--   - companies                → id = current_setting('app.current_company')::uuid
--   - company_primary_contacts → company_id = current_setting('app.current_company')::uuid
--   All other tables in Feature 01 are platform-global and have NO RLS.
--
-- NOTE ON ARCHITECT DOC DIVERGENCE:
--   architect-output.md §7.4 states "No RLS policies yet for new tables —
--   Feature 01 runs pre-RLS." The database-engineer task prompt for this
--   feature explicitly overrides that: RLS is enabled on the Company table
--   in this migration. Rationale: there are no pre-RLS blockers on Company
--   (both legacy blockers concern menu_item / category); enabling RLS at
--   table-birth is cheaper than retrofitting later. Backend-engineer will
--   use TenantContextMiddleware + `SET LOCAL app.current_company` from day
--   one. Confirmed with user prompt.
--
-- IDEMPOTENCY:
--   This migration is NOT idempotent on its table creation (Prisma migrations
--   never are). However the role grants and seed inserts use IF NOT EXISTS /
--   ON CONFLICT DO NOTHING so re-running the raw-SQL suffix is safe.
-- ============================================================================

-- Required extension for `gen_random_uuid()` — used by seed inserts.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 1 — Tables (this block is what `prisma migrate dev` would generate)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- business_types
-- ----------------------------------------------------------------------------
CREATE TABLE "business_types" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "code"       VARCHAR(64) NOT NULL,
  "label_en"   VARCHAR(255) NOT NULL,
  "label_de"   VARCHAR(255) NOT NULL,
  "label_fr"   VARCHAR(255) NOT NULL,
  "label_key"  VARCHAR(128) NOT NULL,
  "sort_order" INTEGER     NOT NULL DEFAULT 0,
  "active"     BOOLEAN     NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_types_code_key" ON "business_types" ("code");
CREATE INDEX "business_types_active_sort_order_idx" ON "business_types" ("active", "sort_order");

-- ----------------------------------------------------------------------------
-- business_categories
-- ----------------------------------------------------------------------------
CREATE TABLE "business_categories" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "code"       VARCHAR(64) NOT NULL,
  "label_en"   VARCHAR(255) NOT NULL,
  "label_de"   VARCHAR(255) NOT NULL,
  "label_fr"   VARCHAR(255) NOT NULL,
  "label_key"  VARCHAR(128) NOT NULL,
  "icon_name"  VARCHAR(64),
  "sort_order" INTEGER     NOT NULL DEFAULT 0,
  "active"     BOOLEAN     NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "business_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_categories_code_key" ON "business_categories" ("code");
CREATE INDEX "business_categories_active_sort_order_idx" ON "business_categories" ("active", "sort_order");

-- ----------------------------------------------------------------------------
-- annual_turnover_bands
-- ----------------------------------------------------------------------------
CREATE TABLE "annual_turnover_bands" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "code"            VARCHAR(64) NOT NULL,
  "label_en"        VARCHAR(255) NOT NULL,
  "label_de"        VARCHAR(255) NOT NULL,
  "label_fr"        VARCHAR(255) NOT NULL,
  "label_key"       VARCHAR(128) NOT NULL,
  "min_amount_gbp"  INTEGER     NOT NULL,
  "max_amount_gbp"  INTEGER,
  "sort_order"      INTEGER     NOT NULL DEFAULT 0,
  "active"          BOOLEAN     NOT NULL DEFAULT true,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMPTZ NOT NULL,
  CONSTRAINT "annual_turnover_bands_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "annual_turnover_bands_code_key" ON "annual_turnover_bands" ("code");
CREATE INDEX "annual_turnover_bands_active_sort_order_idx" ON "annual_turnover_bands" ("active", "sort_order");

-- ----------------------------------------------------------------------------
-- payment_methods
-- ----------------------------------------------------------------------------
CREATE TABLE "payment_methods" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "code"           VARCHAR(64) NOT NULL,
  "label_en"       VARCHAR(255) NOT NULL,
  "label_de"       VARCHAR(255) NOT NULL,
  "label_fr"       VARCHAR(255) NOT NULL,
  "label_key"      VARCHAR(128) NOT NULL,
  "description_en" VARCHAR(512),
  "description_de" VARCHAR(512),
  "description_fr" VARCHAR(512),
  "sort_order"     INTEGER     NOT NULL DEFAULT 0,
  "active"         BOOLEAN     NOT NULL DEFAULT true,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMPTZ NOT NULL,
  CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_methods_code_key" ON "payment_methods" ("code");
CREATE INDEX "payment_methods_active_sort_order_idx" ON "payment_methods" ("active", "sort_order");

-- ----------------------------------------------------------------------------
-- companies (tenancy root)
-- ----------------------------------------------------------------------------
CREATE TABLE "companies" (
  "id"                               UUID        NOT NULL DEFAULT gen_random_uuid(),
  "name"                             VARCHAR(255) NOT NULL,
  "trading_name"                     VARCHAR(255),
  "business_type_code"               VARCHAR(64) NOT NULL,
  "business_type_id"                 UUID        NOT NULL,
  "business_category_id"             UUID        NOT NULL,
  "payment_method_id"                UUID        NOT NULL,
  "annual_turnover_band_id"          UUID        NOT NULL,
  "vat_registered"                   BOOLEAN     NOT NULL DEFAULT false,
  "vat_number"                       VARCHAR(32),
  "registration_number"              VARCHAR(16),
  "incorporation_date"               DATE,
  "registered_address_line1"         VARCHAR(255) NOT NULL,
  "registered_address_line2"         VARCHAR(255),
  "registered_address_city"          VARCHAR(128) NOT NULL,
  "registered_address_region"        VARCHAR(128),
  "registered_address_postcode"      VARCHAR(16) NOT NULL,
  "registered_address_country_code"  CHAR(2)     NOT NULL,
  "self_employed_first_name"         VARCHAR(120),
  "self_employed_last_name"          VARCHAR(120),
  "self_employed_job_position"       VARCHAR(120),
  "self_employed_date_of_birth"      DATE,
  "self_employed_store_is_same_address" BOOLEAN,
  "authorisation_confirmed_at"       TIMESTAMPTZ NOT NULL,
  "idempotency_key"                  UUID        NOT NULL,
  "is_active"                        BOOLEAN     NOT NULL DEFAULT true,
  "created_at"                       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"                       TIMESTAMPTZ NOT NULL,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "companies_business_type_id_fkey"
    FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id"),
  CONSTRAINT "companies_business_category_id_fkey"
    FOREIGN KEY ("business_category_id") REFERENCES "business_categories"("id"),
  CONSTRAINT "companies_payment_method_id_fkey"
    FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id"),
  CONSTRAINT "companies_annual_turnover_band_id_fkey"
    FOREIGN KEY ("annual_turnover_band_id") REFERENCES "annual_turnover_bands"("id")
);
CREATE UNIQUE INDEX "companies_idempotency_key_key"       ON "companies" ("idempotency_key");
-- Full unique indexes (not partial) so the Prisma model can declare them via
-- `@unique(map: "...")` without drift. Both columns are nullable, and Postgres
-- treats NULLs as DISTINCT by default in unique indexes, so multiple NULL rows
-- are still allowed — functionally identical to the previous partial index.
CREATE UNIQUE INDEX "companies_registration_number_key"   ON "companies" ("registration_number");
CREATE UNIQUE INDEX "companies_vat_number_key"            ON "companies" ("vat_number");
CREATE INDEX "companies_business_type_id_idx"             ON "companies" ("business_type_id");
CREATE INDEX "companies_business_category_id_idx"         ON "companies" ("business_category_id");
CREATE INDEX "companies_payment_method_id_idx"            ON "companies" ("payment_method_id");
CREATE INDEX "companies_annual_turnover_band_id_idx"      ON "companies" ("annual_turnover_band_id");
CREATE INDEX "companies_is_active_idx"                    ON "companies" ("is_active");

-- ----------------------------------------------------------------------------
-- users (PLATFORM-GLOBAL — no company_id RLS)
-- ----------------------------------------------------------------------------
CREATE TABLE "users" (
  "id"                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  "email"               VARCHAR(320) NOT NULL,
  "email_normalised"    VARCHAR(320) NOT NULL,
  "password_hash"       VARCHAR(255) NOT NULL,
  "first_name"          VARCHAR(120),
  "last_name"           VARCHAR(120),
  "phone_e164"          VARCHAR(20) NOT NULL,
  "phone_country_code"  VARCHAR(4)  NOT NULL,
  "country_code"        CHAR(2)     NOT NULL,
  "profile_photo_url"   VARCHAR(2048),
  "role"                VARCHAR(32) NOT NULL DEFAULT 'COMPANY_ADMIN',
  "onboarding_phase"    VARCHAR(32) NOT NULL DEFAULT 'PHASE_A_REGISTERED',
  "status"              VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  "email_verified_at"   TIMESTAMPTZ,
  "terms_accepted_at"   TIMESTAMPTZ,
  "password_changed_at" TIMESTAMPTZ,
  "company_id"          UUID,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMPTZ NOT NULL,
  "deleted_at"          TIMESTAMPTZ,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
);
CREATE UNIQUE INDEX "users_email_normalised_key"   ON "users" ("email_normalised");
CREATE INDEX "users_company_id_idx"                ON "users" ("company_id");
CREATE INDEX "users_phone_e164_idx"                ON "users" ("phone_e164");
CREATE INDEX "users_onboarding_phase_status_idx"   ON "users" ("onboarding_phase", "status");
CREATE INDEX "users_created_at_idx"                ON "users" ("created_at");

-- Defensive CHECK constraints to stop mis-typed string-enum values at the DB
-- boundary. These are belt-and-braces; class-validator is the primary gate.
ALTER TABLE "users"
  ADD CONSTRAINT "users_role_check"
  CHECK ("role" IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'SHOP_MANAGER', 'EMPLOYEE', 'CUSTOMER'));
ALTER TABLE "users"
  ADD CONSTRAINT "users_onboarding_phase_check"
  CHECK ("onboarding_phase" IN ('PHASE_A_REGISTERED', 'PHASE_B_VERIFIED', 'PHASE_C_COMPLETED'));
ALTER TABLE "users"
  ADD CONSTRAINT "users_status_check"
  CHECK ("status" IN ('ACTIVE', 'SUSPENDED', 'DELETED'));

-- ----------------------------------------------------------------------------
-- user_device_info
-- ----------------------------------------------------------------------------
CREATE TABLE "user_device_info" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL,
  "device_id"   VARCHAR(128) NOT NULL,
  "platform"    VARCHAR(16) NOT NULL,
  "os_version"  VARCHAR(64) NOT NULL,
  "app_version" VARCHAR(32) NOT NULL,
  "model"       VARCHAR(128),
  "fcm_token"   VARCHAR(512),
  "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMPTZ NOT NULL,
  CONSTRAINT "user_device_info_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_device_info_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "user_device_info_user_id_device_id_key" ON "user_device_info" ("user_id", "device_id");
CREATE INDEX "user_device_info_user_id_idx"                  ON "user_device_info" ("user_id");
CREATE INDEX "user_device_info_fcm_token_idx"                ON "user_device_info" ("fcm_token");
ALTER TABLE "user_device_info"
  ADD CONSTRAINT "user_device_info_platform_check"
  CHECK ("platform" IN ('ios', 'android', 'web'));

-- ----------------------------------------------------------------------------
-- otp_records
-- ----------------------------------------------------------------------------
CREATE TABLE "otp_records" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL,
  "email"       VARCHAR(320) NOT NULL,
  "purpose"     VARCHAR(32) NOT NULL,
  "code_hash"   CHAR(64)    NOT NULL,
  "attempts"    INTEGER     NOT NULL DEFAULT 0,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "consumed_at" TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "otp_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "otp_records_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "otp_records_user_id_purpose_created_at_idx"
  ON "otp_records" ("user_id", "purpose", "created_at" DESC);
CREATE INDEX "otp_records_email_created_at_idx"
  ON "otp_records" ("email", "created_at" DESC);
CREATE INDEX "otp_records_expires_at_idx" ON "otp_records" ("expires_at");
-- Only EMAIL_VERIFICATION is supported in Feature 01 (see shared-types
-- OtpPurpose const). LOGIN was aspirational in an earlier draft and is dropped
-- to match what the application actually writes. Feature 02 can re-add it with
-- a follow-up migration once a login-OTP code path exists.
ALTER TABLE "otp_records"
  ADD CONSTRAINT "otp_records_purpose_check"
  CHECK ("purpose" IN ('EMAIL_VERIFICATION'));

-- ----------------------------------------------------------------------------
-- password_reset_tokens
-- ----------------------------------------------------------------------------
CREATE TABLE "password_reset_tokens" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL,
  "token_hash"  CHAR(64)    NOT NULL,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "consumed_at" TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "password_reset_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key"
  ON "password_reset_tokens" ("token_hash");
CREATE INDEX "password_reset_tokens_user_id_consumed_at_created_at_idx"
  ON "password_reset_tokens" ("user_id", "consumed_at", "created_at" DESC);
CREATE INDEX "password_reset_tokens_expires_at_idx"
  ON "password_reset_tokens" ("expires_at");

-- ----------------------------------------------------------------------------
-- email_verification_tokens (reserved for future link-based flow)
-- ----------------------------------------------------------------------------
CREATE TABLE "email_verification_tokens" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL,
  "token_hash"  CHAR(64)    NOT NULL,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "consumed_at" TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_verification_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key"
  ON "email_verification_tokens" ("token_hash");
CREATE INDEX "email_verification_tokens_user_id_created_at_idx"
  ON "email_verification_tokens" ("user_id", "created_at" DESC);
CREATE INDEX "email_verification_tokens_expires_at_idx"
  ON "email_verification_tokens" ("expires_at");

-- ----------------------------------------------------------------------------
-- refresh_token_records
-- ----------------------------------------------------------------------------
CREATE TABLE "refresh_token_records" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID        NOT NULL,
  "token_hash"  CHAR(64)    NOT NULL,
  "csrf_hash"   CHAR(64)    NOT NULL,
  "user_agent"  VARCHAR(512),
  "ip_address"  VARCHAR(64),
  "rotated_at"  TIMESTAMPTZ,
  "revoked"     BOOLEAN     NOT NULL DEFAULT false,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_token_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refresh_token_records_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "refresh_token_records_token_hash_key"
  ON "refresh_token_records" ("token_hash");
CREATE INDEX "refresh_token_records_user_id_expires_at_idx"
  ON "refresh_token_records" ("user_id", "expires_at");
CREATE INDEX "refresh_token_records_user_id_revoked_rotated_at_idx"
  ON "refresh_token_records" ("user_id", "revoked", "rotated_at");

-- ----------------------------------------------------------------------------
-- company_primary_contacts (multi-tenant — RLS enforced)
-- ----------------------------------------------------------------------------
CREATE TABLE "company_primary_contacts" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "company_id"  UUID        NOT NULL,
  "source"      VARCHAR(16) NOT NULL,
  "psc_id"      VARCHAR(128),
  "first_name"  VARCHAR(120) NOT NULL,
  "last_name"   VARCHAR(120) NOT NULL,
  "job_position" VARCHAR(120) NOT NULL,
  "phone_e164"  VARCHAR(20),
  "email"       VARCHAR(320),
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMPTZ NOT NULL,
  CONSTRAINT "company_primary_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_primary_contacts_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
);
CREATE INDEX "company_primary_contacts_company_id_idx"
  ON "company_primary_contacts" ("company_id");
ALTER TABLE "company_primary_contacts"
  ADD CONSTRAINT "company_primary_contacts_source_check"
  CHECK ("source" IN ('PSC', 'MANUAL'));

-- ============================================================================
-- PART 2 — Row-Level Security (companies + company_primary_contacts only)
--
-- All other tables in this migration are platform-global and have NO RLS.
-- ============================================================================

-- Companies: the root tenancy table. Each row IS its own tenancy boundary,
-- so the policy compares `id` (not `company_id`) to the session variable.
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" FORCE ROW LEVEL SECURITY;

CREATE POLICY "companies_tenant_isolation"
  ON "companies"
  FOR ALL
  TO app_tenant
  USING (id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (id = current_setting('app.current_company', true)::uuid);

-- company_primary_contacts: child of Company, filtered by company_id.
ALTER TABLE "company_primary_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_primary_contacts" FORCE ROW LEVEL SECURITY;

CREATE POLICY "company_primary_contacts_tenant_isolation"
  ON "company_primary_contacts"
  FOR ALL
  TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- ============================================================================
-- PART 3 — Grants
--
-- app_tenant: full CRUD on multi-tenant tables (filtered by RLS), full CRUD
--             on platform-global tables it needs at request time (users,
--             user_device_info, otp_records, password_reset_tokens,
--             email_verification_tokens, refresh_token_records), and SELECT
--             on reference data (business_*, payment_methods,
--             annual_turnover_bands).
-- app_public: SELECT on reference data only. Reserved for future public
--             read endpoints — NOT used in Feature 01.
-- app_system: full CRUD on everything (BYPASSRLS role). Used only by
--             SystemPrismaService, gated by SUPER_ADMIN RBAC.
-- ============================================================================

-- --- app_tenant ---
GRANT SELECT, INSERT, UPDATE, DELETE ON "companies"                  TO app_tenant;
GRANT SELECT, INSERT, UPDATE, DELETE ON "company_primary_contacts"   TO app_tenant;
GRANT SELECT, INSERT, UPDATE, DELETE ON "users"                      TO app_tenant;
GRANT SELECT, INSERT, UPDATE, DELETE ON "user_device_info"           TO app_tenant;
GRANT SELECT, INSERT, UPDATE, DELETE ON "otp_records"                TO app_tenant;
GRANT SELECT, INSERT, UPDATE, DELETE ON "password_reset_tokens"      TO app_tenant;
GRANT SELECT, INSERT, UPDATE, DELETE ON "email_verification_tokens"  TO app_tenant;
GRANT SELECT, INSERT, UPDATE, DELETE ON "refresh_token_records"      TO app_tenant;
GRANT SELECT                         ON "business_types"             TO app_tenant;
GRANT SELECT                         ON "business_categories"        TO app_tenant;
GRANT SELECT                         ON "annual_turnover_bands"      TO app_tenant;
GRANT SELECT                         ON "payment_methods"            TO app_tenant;

-- --- app_public (reference data only, future-use) ---
GRANT SELECT ON "business_types"        TO app_public;
GRANT SELECT ON "business_categories"   TO app_public;
GRANT SELECT ON "annual_turnover_bands" TO app_public;
GRANT SELECT ON "payment_methods"       TO app_public;

-- --- app_system (full CRUD, RLS bypass via BYPASSRLS role) ---
GRANT SELECT, INSERT, UPDATE, DELETE ON "companies"                  TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "company_primary_contacts"   TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "users"                      TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "user_device_info"           TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "otp_records"                TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "password_reset_tokens"      TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "email_verification_tokens"  TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "refresh_token_records"      TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "business_types"             TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "business_categories"        TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "annual_turnover_bands"      TO app_system;
GRANT SELECT, INSERT, UPDATE, DELETE ON "payment_methods"            TO app_system;

-- ============================================================================
-- PART 4 — Seed data for the 4 config enum tables
--
-- Idempotent via ON CONFLICT (code) DO NOTHING. Safe to re-run.
--
-- Seed content is a sensible baseline derived from the Feature 01 designs.
-- Product may add rows later via admin UI or follow-up seed migrations; this
-- set is enough for the onboarding wizard to function end-to-end.
-- ============================================================================

-- -- business_types (2 rows — per register form)
INSERT INTO "business_types"
  ("code", "label_en", "label_de", "label_fr", "label_key", "sort_order", "updated_at")
VALUES
  ('LIMITED_COMPANY', 'Limited company', 'Kapitalgesellschaft',          'Société à responsabilité limitée',
   'config.businessType.limitedCompany', 10, CURRENT_TIMESTAMP),
  ('SELF_EMPLOYED',   'Self-employed',   'Selbstständig',                 'Travailleur indépendant',
   'config.businessType.selfEmployed',   20, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- -- business_categories (baseline list — product can extend)
INSERT INTO "business_categories"
  ("code", "label_en", "label_de", "label_fr", "label_key", "icon_name", "sort_order", "updated_at")
VALUES
  ('FOOD_AND_DRINKS', 'Food & Drinks',   'Essen & Getränke',         'Alimentation & Boissons',
   'config.businessCategory.foodAndDrinks', 'restaurant',     10, CURRENT_TIMESTAMP),
  ('RETAIL',          'Retail',          'Einzelhandel',             'Commerce de détail',
   'config.businessCategory.retail',        'shopping-bag',   20, CURRENT_TIMESTAMP),
  ('SERVICES',        'Services',        'Dienstleistungen',         'Services',
   'config.businessCategory.services',      'briefcase',      30, CURRENT_TIMESTAMP),
  ('HEALTH_BEAUTY',   'Health & Beauty', 'Gesundheit & Schönheit',   'Santé & Beauté',
   'config.businessCategory.healthBeauty',  'heart',          40, CURRENT_TIMESTAMP),
  ('OTHER',           'Other',           'Sonstige',                 'Autre',
   'config.businessCategory.other',         'more-horizontal',90, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- -- annual_turnover_bands (GBP bands — baseline)
INSERT INTO "annual_turnover_bands"
  ("code", "label_en", "label_de", "label_fr", "label_key", "min_amount_gbp", "max_amount_gbp", "sort_order", "updated_at")
VALUES
  ('LT_50K',      'Less than £50,000',      'Weniger als 50.000 £',     'Moins de 50 000 £',
   'config.turnover.lt50k',      0,       50000,    10, CURRENT_TIMESTAMP),
  ('50K_100K',    '£50,000 – £100,000',     '50.000 – 100.000 £',       '50 000 – 100 000 £',
   'config.turnover.50kTo100k',  50000,   100000,   20, CURRENT_TIMESTAMP),
  ('100K_250K',   '£100,000 – £250,000',    '100.000 – 250.000 £',      '100 000 – 250 000 £',
   'config.turnover.100kTo250k', 100000,  250000,   30, CURRENT_TIMESTAMP),
  ('250K_500K',   '£250,000 – £500,000',    '250.000 – 500.000 £',      '250 000 – 500 000 £',
   'config.turnover.250kTo500k', 250000,  500000,   40, CURRENT_TIMESTAMP),
  ('500K_1M',     '£500,000 – £1,000,000',  '500.000 – 1.000.000 £',    '500 000 – 1 000 000 £',
   'config.turnover.500kTo1m',   500000,  1000000,  50, CURRENT_TIMESTAMP),
  ('GT_1M',       'Over £1,000,000',        'Über 1.000.000 £',         'Plus de 1 000 000 £',
   'config.turnover.gt1m',       1000000, NULL,     60, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- -- payment_methods (3 rows — per wizard step 4)
INSERT INTO "payment_methods"
  ("code", "label_en", "label_de", "label_fr", "label_key",
   "description_en", "description_de", "description_fr", "sort_order", "updated_at")
VALUES
  ('PERMANENT_LOCATION',
   'Permanent location', 'Fester Standort',      'Emplacement permanent',
   'config.paymentMethod.permanentLocation',
   'You take payments at a fixed place of business.',
   'Sie nehmen Zahlungen an einem festen Geschäftssitz entgegen.',
   'Vous encaissez des paiements sur un lieu d''activité fixe.',
   10, CURRENT_TIMESTAMP),
  ('ON_THE_GO',
   'On the go',          'Unterwegs',            'En déplacement',
   'config.paymentMethod.onTheGo',
   'You take payments out in the field (events, deliveries, etc.).',
   'Sie nehmen Zahlungen unterwegs entgegen (Events, Lieferungen usw.).',
   'Vous encaissez des paiements en déplacement (événements, livraisons, etc.).',
   20, CURRENT_TIMESTAMP),
  ('BOTH',
   'Both',               'Beides',               'Les deux',
   'config.paymentMethod.both',
   'A mix of a permanent location and on-the-go payments.',
   'Eine Kombination aus festem Standort und Zahlungen unterwegs.',
   'Un mix entre un emplacement fixe et des paiements en déplacement.',
   30, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
