import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Global authentication gate. Every route requires a valid JWT access token
 * unless explicitly marked `@Public()`. Feature 01's pre-auth endpoints
 * (register, login, password-reset initiate/complete) are the only
 * `@Public()` routes in the app.
 */
@Injectable()
export class AuthenticationGuard extends AuthGuard('yellowladder-jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
