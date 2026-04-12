import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Best-effort JWT validation — populates `request.user` if a valid token is
 * present, but does NOT reject anonymous requests. Not used by Feature 01
 * itself but needed by any future public-readable endpoint.
 */
@Injectable()
export class OptionalAuthenticationGuard extends AuthGuard('yellowladder-jwt') {
  override handleRequest<TUser>(_err: unknown, user: TUser): TUser | null {
    return user ?? null;
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
