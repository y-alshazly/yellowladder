// Module
export { MenuItemsModule } from './menu-items.module';

// Services + Repositories (exported for cross-domain reads via barrel)
export { EffectiveMenuService } from './effective-menu.service';
export {
  MenuItemsRepository,
  type CreateMenuItemInput,
  type UpdateMenuItemInput,
} from './menu-items.repository';
export { MenuItemsService } from './menu-items.service';
export {
  ShopMenuItemsRepository,
  type CreateShopMenuItemInput,
  type ShopMenuItemOverrideFields,
  type UpdateShopMenuItemInput,
} from './shop-menu-items.repository';
export { ShopMenuItemsService } from './shop-menu-items.service';

// DTOs
export { CreateMenuItemDto } from './dtos/create-menu-item.dto';
export { GetMenuItemDto } from './dtos/get-menu-item.dto';
export { GetMenuItemsQueryDto } from './dtos/get-menu-items-query.dto';
export { GetShopMenuItemDto } from './dtos/get-shop-menu-item.dto';
export { UpdateMenuItemDto } from './dtos/update-menu-item.dto';
export { UpdateShopMenuItemDto } from './dtos/update-shop-menu-item.dto';

// Swagger
export { ApiEffectiveMenu } from './effective-menu.swagger';
export { ApiMenuItems } from './menu-items.swagger';
export { ApiShopMenuItems } from './shop-menu-items.swagger';
