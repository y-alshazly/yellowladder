import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@yellowladder/shared-types';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

/**
 * Controller-level early rejection convenience. The global `RolesGuard`
 * rejects an HTTP request whose authenticated user does not hold this
 * permission.
 *
 * **Services MUST still call
 * `AuthorizationService.requirePermission(user, ...)` as the first line**
 * because non-HTTP entry points (event handlers, scheduled jobs) bypass
 * this guard. The decorator is a performance optimisation, not a
 * security boundary.
 */
export const RequirePermission = (permission: Permission): MethodDecorator =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);
