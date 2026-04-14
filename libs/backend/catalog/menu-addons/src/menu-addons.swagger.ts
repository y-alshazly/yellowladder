import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type MenuAddonsMethod =
  | 'createOne'
  | 'getMany'
  | 'getOneById'
  | 'updateOneById'
  | 'deleteOneById'
  | 'createOption'
  | 'updateOption'
  | 'deleteOption';

const methodDecorators: Record<MenuAddonsMethod, () => MethodDecorator> = {
  createOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create a new menu addon' }),
      ApiResponse({ status: 201, description: 'Menu addon created successfully' }),
      ApiResponse({ status: 400, description: 'Validation error' }),
      ApiResponse({ status: 403, description: 'Insufficient permissions' }),
    ),
  getMany: () =>
    applyDecorators(
      ApiOperation({ summary: 'List menu addons with pagination' }),
      ApiResponse({ status: 200, description: 'Paginated list of menu addons' }),
    ),
  getOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get a menu addon by ID' }),
      ApiResponse({ status: 200, description: 'Menu addon details with options' }),
      ApiResponse({ status: 404, description: 'Menu addon not found' }),
    ),
  updateOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Update a menu addon by ID' }),
      ApiResponse({ status: 200, description: 'Menu addon updated successfully' }),
      ApiResponse({ status: 404, description: 'Menu addon not found' }),
    ),
  deleteOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a menu addon by ID' }),
      ApiResponse({ status: 200, description: 'Menu addon deleted successfully' }),
      ApiResponse({ status: 404, description: 'Menu addon not found' }),
    ),
  createOption: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create a new option for a menu addon' }),
      ApiResponse({ status: 201, description: 'Menu addon option created successfully' }),
      ApiResponse({ status: 400, description: 'Validation error' }),
      ApiResponse({ status: 404, description: 'Menu addon not found' }),
    ),
  updateOption: () =>
    applyDecorators(
      ApiOperation({ summary: 'Update a menu addon option by ID' }),
      ApiResponse({ status: 200, description: 'Menu addon option updated successfully' }),
      ApiResponse({ status: 404, description: 'Menu addon option not found' }),
    ),
  deleteOption: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a menu addon option by ID' }),
      ApiResponse({ status: 200, description: 'Menu addon option deleted successfully' }),
      ApiResponse({ status: 404, description: 'Menu addon option not found' }),
    ),
};

export function ApiMenuAddons(): ClassDecorator;
export function ApiMenuAddons(method: MenuAddonsMethod): MethodDecorator;
export function ApiMenuAddons(method?: MenuAddonsMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Menu Addons'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
