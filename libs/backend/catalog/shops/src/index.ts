// Module
export { ShopsModule } from './shops.module';

// Service + Repository (exported for cross-domain reads via barrel)
export { ShopsRepository, type CreateShopInput, type UpdateShopInput } from './shops.repository';
export { ShopsService } from './shops.service';

// DTOs
export { CreateShopDto } from './dtos/create-shop.dto';
export { GetShopDto } from './dtos/get-shop.dto';
export { GetShopsQueryDto } from './dtos/get-shops-query.dto';
export { ReorderShopsDto } from './dtos/reorder-shops.dto';
export { ShopAddressDto } from './dtos/shop-address.dto';
export { UpdateShopDto } from './dtos/update-shop.dto';

// Swagger
export { ApiShops } from './shops.swagger';
