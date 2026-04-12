import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '@yellowladder/shared-types';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

/**
 * Injects the authenticated user on a controller method:
 *
 * ```ts
 * @Get('me')
 * async getMe(@CurrentUser() user: AuthenticatedUser) {
 *   return this.usersService.getMe(user);
 * }
 * ```
 *
 * Services MUST receive the user and call
 * `AuthorizationService.requirePermission(user, ...)` as their first line.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      throw new Error(
        'CurrentUser decorator invoked on a route without an authenticated user. ' +
          'Check that AuthenticationGuard is applied.',
      );
    }
    return request.user;
  },
);
