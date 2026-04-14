-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name_en" VARCHAR(255) NOT NULL,
    "name_de" VARCHAR(255) NOT NULL,
    "name_fr" VARCHAR(255) NOT NULL,
    "icon_name" VARCHAR(64),
    "emoji_code" VARCHAR(32),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_categories" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name_en" VARCHAR(255),
    "name_de" VARCHAR(255),
    "name_fr" VARCHAR(255),
    "sort_order" INTEGER,
    "is_active" BOOLEAN,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shop_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name_en" VARCHAR(255) NOT NULL,
    "name_de" VARCHAR(255) NOT NULL,
    "name_fr" VARCHAR(255) NOT NULL,
    "description_en" VARCHAR(1024),
    "description_de" VARCHAR(1024),
    "description_fr" VARCHAR(1024),
    "base_price" DECIMAL(10,2) NOT NULL,
    "image_url" VARCHAR(2048),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_draft" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_menu_items" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "name_en" VARCHAR(255),
    "name_de" VARCHAR(255),
    "name_fr" VARCHAR(255),
    "base_price" DECIMAL(10,2),
    "is_active" BOOLEAN,
    "sort_order" INTEGER,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shop_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_addons" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "name_en" VARCHAR(255) NOT NULL,
    "name_de" VARCHAR(255) NOT NULL,
    "name_fr" VARCHAR(255) NOT NULL,
    "is_multi_select" BOOLEAN NOT NULL DEFAULT false,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "max_selections" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "menu_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_addon_options" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "menu_addon_id" UUID NOT NULL,
    "name_en" VARCHAR(255) NOT NULL,
    "name_de" VARCHAR(255) NOT NULL,
    "name_fr" VARCHAR(255) NOT NULL,
    "price_modifier" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "color_hex" VARCHAR(7),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "menu_addon_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_menu_addons" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "menu_addon_id" UUID NOT NULL,
    "name_en" VARCHAR(255),
    "name_de" VARCHAR(255),
    "name_fr" VARCHAR(255),
    "is_multi_select" BOOLEAN,
    "is_required" BOOLEAN,
    "max_selections" INTEGER,
    "sort_order" INTEGER,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shop_menu_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_menu_addon_options" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "menu_addon_option_id" UUID NOT NULL,
    "name_en" VARCHAR(255),
    "name_de" VARCHAR(255),
    "name_fr" VARCHAR(255),
    "price_modifier" DECIMAL(10,2),
    "color_hex" VARCHAR(7),
    "sort_order" INTEGER,
    "is_active" BOOLEAN,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shop_menu_addon_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_purchase_counts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "item_purchase_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_shop_item_orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_shop_item_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_company_id_sort_order_idx" ON "categories"("company_id", "sort_order");

-- CreateIndex
CREATE INDEX "categories_company_id_is_active_idx" ON "categories"("company_id", "is_active");

-- CreateIndex
CREATE INDEX "shop_categories_company_id_shop_id_idx" ON "shop_categories"("company_id", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_categories_shop_id_category_id_key" ON "shop_categories"("shop_id", "category_id");

-- CreateIndex
CREATE INDEX "menu_items_company_id_category_id_idx" ON "menu_items"("company_id", "category_id");

-- CreateIndex
CREATE INDEX "menu_items_company_id_sort_order_idx" ON "menu_items"("company_id", "sort_order");

-- CreateIndex
CREATE INDEX "menu_items_company_id_is_active_is_draft_idx" ON "menu_items"("company_id", "is_active", "is_draft");

-- CreateIndex
CREATE INDEX "shop_menu_items_company_id_shop_id_idx" ON "shop_menu_items"("company_id", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_menu_items_shop_id_menu_item_id_key" ON "shop_menu_items"("shop_id", "menu_item_id");

-- CreateIndex
CREATE INDEX "menu_addons_company_id_menu_item_id_idx" ON "menu_addons"("company_id", "menu_item_id");

-- CreateIndex
CREATE INDEX "menu_addons_company_id_sort_order_idx" ON "menu_addons"("company_id", "sort_order");

-- CreateIndex
CREATE INDEX "menu_addon_options_company_id_menu_addon_id_idx" ON "menu_addon_options"("company_id", "menu_addon_id");

-- CreateIndex
CREATE INDEX "shop_menu_addons_company_id_shop_id_idx" ON "shop_menu_addons"("company_id", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_menu_addons_shop_id_menu_addon_id_key" ON "shop_menu_addons"("shop_id", "menu_addon_id");

-- CreateIndex
CREATE INDEX "shop_menu_addon_options_company_id_shop_id_idx" ON "shop_menu_addon_options"("company_id", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_menu_addon_options_shop_id_menu_addon_option_id_key" ON "shop_menu_addon_options"("shop_id", "menu_addon_option_id");

-- CreateIndex
CREATE INDEX "item_purchase_counts_company_id_shop_id_idx" ON "item_purchase_counts"("company_id", "shop_id");

-- CreateIndex
CREATE INDEX "item_purchase_counts_company_id_menu_item_id_idx" ON "item_purchase_counts"("company_id", "menu_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_purchase_counts_shop_id_menu_item_id_key" ON "item_purchase_counts"("shop_id", "menu_item_id");

-- CreateIndex
CREATE INDEX "user_shop_item_orders_user_id_shop_id_sort_order_idx" ON "user_shop_item_orders"("user_id", "shop_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_shop_item_orders_user_id_shop_id_menu_item_id_key" ON "user_shop_item_orders"("user_id", "shop_id", "menu_item_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_menu_items" ADD CONSTRAINT "shop_menu_items_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_menu_items" ADD CONSTRAINT "shop_menu_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_addons" ADD CONSTRAINT "menu_addons_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_addon_options" ADD CONSTRAINT "menu_addon_options_menu_addon_id_fkey" FOREIGN KEY ("menu_addon_id") REFERENCES "menu_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_menu_addons" ADD CONSTRAINT "shop_menu_addons_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_menu_addons" ADD CONSTRAINT "shop_menu_addons_menu_addon_id_fkey" FOREIGN KEY ("menu_addon_id") REFERENCES "menu_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_menu_addon_options" ADD CONSTRAINT "shop_menu_addon_options_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_menu_addon_options" ADD CONSTRAINT "shop_menu_addon_options_menu_addon_option_id_fkey" FOREIGN KEY ("menu_addon_option_id") REFERENCES "menu_addon_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_purchase_counts" ADD CONSTRAINT "item_purchase_counts_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_purchase_counts" ADD CONSTRAINT "item_purchase_counts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shop_item_orders" ADD CONSTRAINT "user_shop_item_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shop_item_orders" ADD CONSTRAINT "user_shop_item_orders_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shop_item_orders" ADD CONSTRAINT "user_shop_item_orders_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS policy: tenant isolation on categories (scoped to company_id)
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_categories ON "categories"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "categories" TO app_tenant;
GRANT SELECT ON "categories" TO app_public;
GRANT ALL ON "categories" TO app_system;

-- RLS policy: tenant isolation on shop_categories (scoped to company_id)
ALTER TABLE "shop_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_shop_categories ON "shop_categories"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "shop_categories" TO app_tenant;
GRANT SELECT ON "shop_categories" TO app_public;
GRANT ALL ON "shop_categories" TO app_system;

-- RLS policy: tenant isolation on menu_items (scoped to company_id)
ALTER TABLE "menu_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_menu_items ON "menu_items"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "menu_items" TO app_tenant;
GRANT SELECT ON "menu_items" TO app_public;
GRANT ALL ON "menu_items" TO app_system;

-- RLS policy: tenant isolation on shop_menu_items (scoped to company_id)
ALTER TABLE "shop_menu_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_shop_menu_items ON "shop_menu_items"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "shop_menu_items" TO app_tenant;
GRANT SELECT ON "shop_menu_items" TO app_public;
GRANT ALL ON "shop_menu_items" TO app_system;

-- RLS policy: tenant isolation on menu_addons (scoped to company_id)
ALTER TABLE "menu_addons" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_menu_addons ON "menu_addons"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "menu_addons" TO app_tenant;
GRANT SELECT ON "menu_addons" TO app_public;
GRANT ALL ON "menu_addons" TO app_system;

-- RLS policy: tenant isolation on menu_addon_options (scoped to company_id)
ALTER TABLE "menu_addon_options" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_menu_addon_options ON "menu_addon_options"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "menu_addon_options" TO app_tenant;
GRANT SELECT ON "menu_addon_options" TO app_public;
GRANT ALL ON "menu_addon_options" TO app_system;

-- RLS policy: tenant isolation on shop_menu_addons (scoped to company_id)
ALTER TABLE "shop_menu_addons" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_shop_menu_addons ON "shop_menu_addons"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "shop_menu_addons" TO app_tenant;
GRANT SELECT ON "shop_menu_addons" TO app_public;
GRANT ALL ON "shop_menu_addons" TO app_system;

-- RLS policy: tenant isolation on shop_menu_addon_options (scoped to company_id)
ALTER TABLE "shop_menu_addon_options" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_shop_menu_addon_options ON "shop_menu_addon_options"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "shop_menu_addon_options" TO app_tenant;
GRANT SELECT ON "shop_menu_addon_options" TO app_public;
GRANT ALL ON "shop_menu_addon_options" TO app_system;

-- RLS policy: tenant isolation on item_purchase_counts (scoped to company_id)
ALTER TABLE "item_purchase_counts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_item_purchase_counts ON "item_purchase_counts"
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company', true)::uuid)
  WITH CHECK (company_id = current_setting('app.current_company', true)::uuid);

-- Grant permissions to database roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "item_purchase_counts" TO app_tenant;
GRANT SELECT ON "item_purchase_counts" TO app_public;
GRANT ALL ON "item_purchase_counts" TO app_system;

-- user_shop_item_orders is PLATFORM-GLOBAL (no company_id, no RLS).
-- Access is enforced in the service layer via AuthorizationService.
-- Grants only:
GRANT SELECT, INSERT, UPDATE, DELETE ON "user_shop_item_orders" TO app_tenant;
GRANT SELECT ON "user_shop_item_orders" TO app_public;
GRANT ALL ON "user_shop_item_orders" TO app_system;
