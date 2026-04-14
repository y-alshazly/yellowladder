import { Module } from '@nestjs/common';
import { AuditModule } from '@yellowladder/backend-identity-audit';
import { AuthorizationModule } from '@yellowladder/backend-identity-authorization';
import { DatabaseModule } from '@yellowladder/backend-infra-database';
import { MenuAddonOptionsRepository } from './menu-addon-options.repository';
import { MenuAddonsController } from './menu-addons.controller';
import { MenuAddonsRepository } from './menu-addons.repository';
import { MenuAddonsService } from './menu-addons.service';
import { ShopMenuAddonOptionsRepository } from './shop-menu-addon-options.repository';
import { ShopMenuAddonsController } from './shop-menu-addons.controller';
import { ShopMenuAddonsRepository } from './shop-menu-addons.repository';
import { ShopMenuAddonsService } from './shop-menu-addons.service';

@Module({
  imports: [DatabaseModule, AuthorizationModule, AuditModule],
  controllers: [MenuAddonsController, ShopMenuAddonsController],
  providers: [
    MenuAddonsService,
    MenuAddonsRepository,
    MenuAddonOptionsRepository,
    ShopMenuAddonsService,
    ShopMenuAddonsRepository,
    ShopMenuAddonOptionsRepository,
  ],
  exports: [MenuAddonsService],
})
export class MenuAddonsModule {}
