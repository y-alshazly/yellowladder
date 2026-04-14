import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type MenuItemsMethod = 'createOne' | 'getMany' | 'getOneById' | 'updateOneById' | 'deleteOneById';

const methodDecorators: Record<MenuItemsMethod, () => MethodDecorator> = {
  createOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create a new menu item' }),
      ApiResponse({ status: 201, description: 'Menu item created successfully' }),
      ApiResponse({ status: 400, description: 'Validation error' }),
      ApiResponse({ status: 403, description: 'Insufficient permissions or no company' }),
    ),
  getMany: () =>
    applyDecorators(
      ApiOperation({ summary: 'List menu items with pagination' }),
      ApiResponse({ status: 200, description: 'Paginated list of menu items' }),
    ),
  getOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get a menu item by ID' }),
      ApiResponse({ status: 200, description: 'Menu item details' }),
      ApiResponse({ status: 404, description: 'Menu item not found' }),
    ),
  updateOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Update a menu item by ID' }),
      ApiResponse({ status: 200, description: 'Menu item updated successfully' }),
      ApiResponse({ status: 404, description: 'Menu item not found' }),
    ),
  deleteOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a menu item by ID' }),
      ApiResponse({ status: 200, description: 'Menu item deleted successfully' }),
      ApiResponse({ status: 404, description: 'Menu item not found' }),
    ),
};

export function ApiMenuItems(): ClassDecorator;
export function ApiMenuItems(method: MenuItemsMethod): MethodDecorator;
export function ApiMenuItems(method?: MenuItemsMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Menu Items'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
