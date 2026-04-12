import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route handler as public. The global `AuthenticationGuard` skips
 * JWT validation when this metadata is present. Use sparingly — Yellow
 * Ladder has no public API surface today; this decorator is reserved for
 * pre-authentication endpoints (login, register, forgot-password, etc.).
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
