import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type UsersMethod = 'getMe' | 'updateMe' | 'changePassword' | 'uploadPhoto';

const methodDecorators: Record<UsersMethod, () => MethodDecorator> = {
  getMe: () =>
    applyDecorators(
      ApiOperation({ summary: 'Read the authenticated user profile' }),
      ApiResponse({ status: 200 }),
    ),
  updateMe: () =>
    applyDecorators(
      ApiOperation({ summary: 'Update the authenticated user profile' }),
      ApiResponse({ status: 200 }),
    ),
  changePassword: () =>
    applyDecorators(
      ApiOperation({ summary: 'Change the authenticated user password' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 400, description: 'Current password incorrect' }),
    ),
  uploadPhoto: () =>
    applyDecorators(
      ApiOperation({ summary: 'Upload a profile photo (NOT YET SUPPORTED)' }),
      ApiResponse({ status: 501, description: 'Deferred to Feature 02' }),
    ),
};

export function ApiUsers(): ClassDecorator;
export function ApiUsers(method: UsersMethod): MethodDecorator;
export function ApiUsers(method?: UsersMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Users'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
