import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type ShopsMethod =
  | 'createOne'
  | 'getMany'
  | 'getOneById'
  | 'updateOneById'
  | 'archiveOneById'
  | 'unarchiveOneById'
  | 'reorder';

const methodDecorators: Record<ShopsMethod, () => MethodDecorator> = {
  createOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create a new shop' }),
      ApiResponse({ status: 201, description: 'Shop created successfully' }),
      ApiResponse({ status: 400, description: 'Validation error' }),
      ApiResponse({ status: 403, description: 'Insufficient permissions or no company' }),
    ),
  getMany: () =>
    applyDecorators(
      ApiOperation({ summary: 'List shops with pagination' }),
      ApiResponse({ status: 200, description: 'Paginated list of shops' }),
    ),
  getOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get a shop by ID' }),
      ApiResponse({ status: 200, description: 'Shop details' }),
      ApiResponse({ status: 404, description: 'Shop not found' }),
    ),
  updateOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Update a shop by ID' }),
      ApiResponse({ status: 200, description: 'Shop updated successfully' }),
      ApiResponse({ status: 404, description: 'Shop not found' }),
    ),
  archiveOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Archive a shop by ID' }),
      ApiResponse({ status: 200, description: 'Shop archived successfully' }),
      ApiResponse({ status: 404, description: 'Shop not found' }),
      ApiResponse({ status: 409, description: 'Shop is already archived or is the main shop' }),
    ),
  unarchiveOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Unarchive a shop by ID' }),
      ApiResponse({ status: 200, description: 'Shop unarchived successfully' }),
      ApiResponse({ status: 404, description: 'Shop not found' }),
      ApiResponse({ status: 409, description: 'Shop is not archived' }),
    ),
  reorder: () =>
    applyDecorators(
      ApiOperation({ summary: 'Reorder shops by providing the new order of shop IDs' }),
      ApiResponse({ status: 200, description: 'Shops reordered successfully' }),
      ApiResponse({ status: 400, description: 'Invalid reorder list' }),
    ),
};

export function ApiShops(): ClassDecorator;
export function ApiShops(method: ShopsMethod): MethodDecorator;
export function ApiShops(method?: ShopsMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Shops'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
