// Module
export { CategoriesModule } from './categories.module';

// Service + Repository (exported for cross-domain reads via barrel)
export {
  CategoriesRepository,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from './categories.repository';
export { CategoriesService } from './categories.service';

// Shop Category overrides
export { ShopCategoriesController } from './shop-categories.controller';
export {
  ShopCategoriesRepository,
  type ShopCategoryOverrideFields,
  type UpdateShopCategoryInput,
} from './shop-categories.repository';
export { ShopCategoriesService } from './shop-categories.service';

// DTOs
export { CreateCategoryDto } from './dtos/create-category.dto';
export { GetCategoriesQueryDto } from './dtos/get-categories-query.dto';
export { GetCategoryDto } from './dtos/get-category.dto';
export { GetShopCategoryDto } from './dtos/get-shop-category.dto';
export { ReorderCategoriesDto } from './dtos/reorder-categories.dto';
export { UpdateCategoryDto } from './dtos/update-category.dto';
export { UpdateShopCategoryDto } from './dtos/update-shop-category.dto';

// Swagger
export { ApiCategories } from './categories.swagger';
export { ApiShopCategories } from './shop-categories.swagger';
