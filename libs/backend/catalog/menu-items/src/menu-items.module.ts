import { Module } from '@nestjs/common';
import { AuditModule } from '@yellowladder/backend-identity-audit';
import { AuthorizationModule } from '@yellowladder/backend-identity-authorization';
import { DatabaseModule } from '@yellowladder/backend-infra-database';
import { EffectiveMenuController } from './effective-menu.controller';
import { EffectiveMenuRepository } from './effective-menu.repository';
import { EffectiveMenuService } from './effective-menu.service';
import { MenuItemsController } from './menu-items.controller';
import { MenuItemsRepository } from './menu-items.repository';
import { MenuItemsService } from './menu-items.service';
import { ShopMenuItemsController } from './shop-menu-items.controller';
import { ShopMenuItemsRepository } from './shop-menu-items.repository';
import { ShopMenuItemsService } from './shop-menu-items.service';

@Module({
  imports: [DatabaseModule, AuthorizationModule, AuditModule],
  controllers: [MenuItemsController, ShopMenuItemsController, EffectiveMenuController],
  providers: [
    MenuItemsService,
    MenuItemsRepository,
    ShopMenuItemsService,
    ShopMenuItemsRepository,
    EffectiveMenuRepository,
    EffectiveMenuService,
  ],
  exports: [MenuItemsService, MenuItemsRepository, EffectiveMenuService],
})
export class MenuItemsModule {}
