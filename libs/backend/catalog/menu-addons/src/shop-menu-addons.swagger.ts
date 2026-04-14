import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type ShopMenuAddonsMethod =
  | 'getMany'
  | 'createOrUpdateOne'
  | 'deleteOne'
  | 'createOrUpdateOption'
  | 'deleteOption';

const methodDecorators: Record<ShopMenuAddonsMethod, () => MethodDecorator> = {
  getMany: () =>
    applyDecorators(
      ApiOperation({ summary: 'List shop menu addon overrides' }),
      ApiResponse({ status: 200, description: 'Paginated list of shop menu addon overrides' }),
    ),
  createOrUpdateOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create or update a shop menu addon override' }),
      ApiResponse({ status: 200, description: 'Shop menu addon override upserted successfully' }),
      ApiResponse({ status: 404, description: 'Menu addon not found' }),
    ),
  deleteOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a shop menu addon override' }),
      ApiResponse({ status: 200, description: 'Shop menu addon override deleted successfully' }),
      ApiResponse({ status: 404, description: 'Shop menu addon override not found' }),
    ),
  createOrUpdateOption: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create or update a shop menu addon option override' }),
      ApiResponse({
        status: 200,
        description: 'Shop menu addon option override upserted successfully',
      }),
      ApiResponse({ status: 404, description: 'Menu addon option not found' }),
    ),
  deleteOption: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a shop menu addon option override' }),
      ApiResponse({
        status: 200,
        description: 'Shop menu addon option override deleted successfully',
      }),
      ApiResponse({ status: 404, description: 'Shop menu addon option override not found' }),
    ),
};

export function ApiShopMenuAddons(): ClassDecorator;
export function ApiShopMenuAddons(method: ShopMenuAddonsMethod): MethodDecorator;
export function ApiShopMenuAddons(method?: ShopMenuAddonsMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Shop Menu Addon Overrides'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
