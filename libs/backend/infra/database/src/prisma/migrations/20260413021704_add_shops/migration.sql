-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_annual_turnover_band_id_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_business_category_id_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_business_type_id_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_payment_method_id_fkey";

-- DropForeignKey
ALTER TABLE "company_primary_contacts" DROP CONSTRAINT "company_primary_contacts_company_id_fkey";

-- DropForeignKey
ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "otp_records" DROP CONSTRAINT "otp_records_user_id_fkey";

-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_token_records" DROP CONSTRAINT "refresh_token_records_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_device_info" DROP CONSTRAINT "user_device_info_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_company_id_fkey";

-- NOTE: Prisma emitted a block of 13 `ALTER COLUMN "id" DROP DEFAULT` statements
-- here (annual_turnover_bands, business_categories, business_types, companies,
-- company_primary_contacts, email_verification_tokens, otp_records,
-- password_reset_tokens, payment_methods, refresh_token_records, user_device_info,
-- users). Those were intentionally removed: the identity `.prisma` models still
-- use `@default(uuid())`, and the init migration + seed path rely on the DB-level
-- `DEFAULT gen_random_uuid()` to populate `id`. Dropping the defaults would break
-- every identity INSERT (e.g. UsersService.createTeamMember does not pass `id`).
-- If a future Prisma diff re-emits these drops, flip the identity models to
-- `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` so the
-- generated migration no longer tries to strip the DB default.

-- CreateTable
CREATE TABLE "shops" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo_url" VARCHAR(2048),
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "address_city" VARCHAR(128) NOT NULL,
    "address_region" VARCHAR(128),
    "address_postcode" VARCHAR(16) NOT NULL,
    "address_country_code" CHAR(2) NOT NULL,
    "phone" VARCHAR(20),
    "hours" JSON,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_shops" (
    "user_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shops_pkey" PRIMARY KEY ("user_id","shop_id")
);

-- CreateIndex
CREATE INDEX "shops_company_id_sort_order_idx" ON "shops"("company_id", "sort_order");

-- CreateIndex
CREATE INDEX "shops_company_id_is_archived_idx" ON "shops"("company_id", "is_archived");

-- CreateIndex
CREATE INDEX "user_shops_shop_id_idx" ON "user_shops"("shop_id");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shops" ADD CONSTRAINT "user_shops_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shops" ADD CONSTRAINT "user_shops_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "business_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_business_category_id_fkey" FOREIGN KEY ("business_category_id") REFERENCES "business_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_annual_turnover_band_id_fkey" FOREIGN KEY ("annual_turnover_band_id") REFERENCES "annual_turnover_bands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_info" ADD CONSTRAINT "user_device_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_records" ADD CONSTRAINT "otp_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token_records" ADD CONSTRAINT "refresh_token_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_primary_contacts" ADD CONSTRAINT "company_primary_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS policy: tenant isolation on shops (scoped to company_id)
ALTER TABLE "shops" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_shops ON "shops"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "shops" TO app_tenant;
GRANT SELECT ON "shops" TO app_public;
GRANT ALL ON "shops" TO app_system;

GRANT SELECT, INSERT, DELETE ON "user_shops" TO app_tenant;
GRANT SELECT ON "user_shops" TO app_public;
GRANT ALL ON "user_shops" TO app_system;

-- Partial unique index: exactly one main shop per company
CREATE UNIQUE INDEX shops_company_id_is_main_unique ON "shops" (company_id) WHERE is_main = true;
