import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type ShopMenuItemsMethod = 'getMany' | 'createOrUpdate' | 'deleteOne';

const methodDecorators: Record<ShopMenuItemsMethod, () => MethodDecorator> = {
  getMany: () =>
    applyDecorators(
      ApiOperation({ summary: 'List shop menu item overrides' }),
      ApiResponse({ status: 200, description: 'Paginated list of shop menu item overrides' }),
    ),
  createOrUpdate: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create or update a shop menu item override' }),
      ApiResponse({ status: 200, description: 'Shop menu item override upserted successfully' }),
      ApiResponse({ status: 404, description: 'Menu item not found' }),
    ),
  deleteOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a shop menu item override' }),
      ApiResponse({ status: 200, description: 'Shop menu item override deleted successfully' }),
      ApiResponse({ status: 404, description: 'Shop menu item override not found' }),
    ),
};

export function ApiShopMenuItems(): ClassDecorator;
export function ApiShopMenuItems(method: ShopMenuItemsMethod): MethodDecorator;
export function ApiShopMenuItems(method?: ShopMenuItemsMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Shop Menu Item Overrides'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
