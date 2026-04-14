import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type ShopCategoriesMethod = 'getMany' | 'createOrUpdate' | 'deleteOne';

const methodDecorators: Record<ShopCategoriesMethod, () => MethodDecorator> = {
  getMany: () =>
    applyDecorators(
      ApiOperation({ summary: 'List shop category overrides' }),
      ApiResponse({ status: 200, description: 'List of shop category overrides' }),
    ),
  createOrUpdate: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create or update a shop category override' }),
      ApiResponse({ status: 200, description: 'Shop category override upserted successfully' }),
      ApiResponse({ status: 404, description: 'Category not found' }),
    ),
  deleteOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a shop category override' }),
      ApiResponse({ status: 200, description: 'Shop category override deleted successfully' }),
      ApiResponse({ status: 404, description: 'Shop category override not found' }),
    ),
};

export function ApiShopCategories(): ClassDecorator;
export function ApiShopCategories(method: ShopCategoriesMethod): MethodDecorator;
export function ApiShopCategories(method?: ShopCategoriesMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Shop Category Overrides'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
