import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type UsersMethod =
  | 'getMe'
  | 'updateMe'
  | 'changePassword'
  | 'uploadPhoto'
  | 'createOne'
  | 'getMany'
  | 'getOneById'
  | 'updateOneById'
  | 'deleteOneById'
  | 'updateRole'
  | 'assignShops'
  | 'adminResetPassword';

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
  createOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create a new team member' }),
      ApiResponse({ status: 201, description: 'Team member created' }),
      ApiResponse({ status: 409, description: 'Email already in use' }),
    ),
  getMany: () =>
    applyDecorators(
      ApiOperation({ summary: 'List team members with pagination and filters' }),
      ApiResponse({ status: 200 }),
    ),
  getOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get a team member by ID' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 404, description: 'User not found' }),
    ),
  updateOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Update a team member profile' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 404, description: 'User not found' }),
      ApiResponse({ status: 409, description: 'Email already in use' }),
    ),
  deleteOneById: () =>
    applyDecorators(
      ApiOperation({ summary: 'Soft-delete a team member' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 404, description: 'User not found' }),
      ApiResponse({ status: 409, description: 'Cannot delete last Company Admin' }),
    ),
  updateRole: () =>
    applyDecorators(
      ApiOperation({ summary: 'Update a team member role' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 403, description: 'Privilege escalation' }),
      ApiResponse({ status: 404, description: 'User not found' }),
      ApiResponse({ status: 409, description: 'Cannot demote last Company Admin' }),
    ),
  assignShops: () =>
    applyDecorators(
      ApiOperation({ summary: 'Replace shop assignments for a team member' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 400, description: 'Shop not in company' }),
      ApiResponse({ status: 404, description: 'User not found' }),
    ),
  adminResetPassword: () =>
    applyDecorators(
      ApiOperation({ summary: 'Trigger a password reset email for a team member' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 404, description: 'User not found' }),
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
