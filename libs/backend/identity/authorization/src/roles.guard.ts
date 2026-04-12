import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION_KEY } from '@yellowladder/backend-infra-auth';
import type { AuthenticatedUser, Permission } from '@yellowladder/shared-types';
import { AuthorizationService } from './authorization.service';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

/**
 * Global convenience guard that rejects HTTP requests whose authenticated
 * user does not hold the permission declared via `@RequirePermission()` on
 * the controller method.
 *
 * Services MUST still call `AuthorizationService.requirePermission(user, ...)`
 * as the first line — non-HTTP entry points (event handlers, scheduled jobs)
 * bypass this guard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      return false;
    }
    this.authorizationService.requirePermission(user, required);
    return true;
  }
}
