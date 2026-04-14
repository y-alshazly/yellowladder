import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type CategoriesMethod =
  | 'createOne'
  | 'getMany'
  | 'getOneById'
  | 'updateOneById'
  | 'deleteOneById'
  | 'reorder';

const methodDecorators: Record<CategoriesMethod, () => MethodDecorator> = {
  createOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create a new category' }),
      ApiResponse({ status: 201, description: 'Category created successfully' }),
      ApiResponse({ status: 400, description: 'Validation error' }),
      ApiResponse({ status: 403, description: 'Insufficient permissions or no company' }),
    ),
  getMany: () =>
    applyDecorators(
      ApiOperation({ summary: 'List categories with pagination' }),
      ApiResponse({ status: 200, description: 'Paginated list of categories' }),
    ),
  getOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get a category by ID' }),
      ApiResponse({ status: 200, description: 'Category details' }),
      ApiResponse({ status: 404, description: 'Category not found' }),
    ),
  updateOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Update a category by ID' }),
      ApiResponse({ status: 200, description: 'Category updated successfully' }),
      ApiResponse({ status: 404, description: 'Category not found' }),
    ),
  deleteOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a category by ID' }),
      ApiResponse({ status: 200, description: 'Category deleted successfully' }),
      ApiResponse({ status: 404, description: 'Category not found' }),
      ApiResponse({ status: 409, description: 'Category has menu items' }),
    ),
  reorder: () =>
    applyDecorators(
      ApiOperation({ summary: 'Reorder categories by providing the new order of category IDs' }),
      ApiResponse({ status: 200, description: 'Categories reordered successfully' }),
      ApiResponse({ status: 400, description: 'Invalid reorder list' }),
    ),
};

export function ApiCategories(): ClassDecorator;
export function ApiCategories(method: CategoriesMethod): MethodDecorator;
export function ApiCategories(method?: CategoriesMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Categories'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
