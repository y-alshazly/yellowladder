// Module
export { MenuAddonsModule } from './menu-addons.module';

// Services + Repositories (exported for cross-domain reads via barrel)
export {
  MenuAddonOptionsRepository,
  type CreateMenuAddonOptionInput,
  type UpdateMenuAddonOptionInput,
} from './menu-addon-options.repository';
export {
  MenuAddonsRepository,
  type CreateMenuAddonInput,
  type UpdateMenuAddonInput,
} from './menu-addons.repository';
export { MenuAddonsService } from './menu-addons.service';
export {
  ShopMenuAddonOptionsRepository,
  type CreateShopMenuAddonOptionInput,
  type ShopMenuAddonOptionOverrideFields,
  type UpdateShopMenuAddonOptionInput,
} from './shop-menu-addon-options.repository';
export {
  ShopMenuAddonsRepository,
  type CreateShopMenuAddonInput,
  type ShopMenuAddonOverrideFields,
  type UpdateShopMenuAddonInput,
} from './shop-menu-addons.repository';
export { ShopMenuAddonsService } from './shop-menu-addons.service';

// DTOs
export { CreateMenuAddonOptionDto } from './dtos/create-menu-addon-option.dto';
export { CreateMenuAddonDto } from './dtos/create-menu-addon.dto';
export { GetMenuAddonOptionDto } from './dtos/get-menu-addon-option.dto';
export { GetMenuAddonDto } from './dtos/get-menu-addon.dto';
export { GetMenuAddonsQueryDto } from './dtos/get-menu-addons-query.dto';
export { GetShopMenuAddonOptionDto } from './dtos/get-shop-menu-addon-option.dto';
export { GetShopMenuAddonDto } from './dtos/get-shop-menu-addon.dto';
export { UpdateMenuAddonOptionDto } from './dtos/update-menu-addon-option.dto';
export { UpdateMenuAddonDto } from './dtos/update-menu-addon.dto';
export { UpdateShopMenuAddonOptionDto } from './dtos/update-shop-menu-addon-option.dto';
export { UpdateShopMenuAddonDto } from './dtos/update-shop-menu-addon.dto';

// Swagger
export { ApiMenuAddons } from './menu-addons.swagger';
export { ApiShopMenuAddons } from './shop-menu-addons.swagger';
