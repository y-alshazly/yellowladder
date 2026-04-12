import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { YellowladderConfigService } from '@yellowladder/backend-infra-config';
import type { AuthenticatedUser } from '@yellowladder/shared-types';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtAccessTokenPayload } from './jwt-payload.interface';

/**
 * Passport `jwt` strategy for access tokens.
 *
 * Verifies via the configured `JWT_ACCESS_SECRET`. Dual-secret rotation is
 * handled inside `TokenService.verifyAccessToken`, but Passport only takes a
 * single secret here — so we use the CURRENT secret and rely on
 * `TokenService` for the rotation path in the `/auth/refresh` endpoint.
 *
 * Return value becomes `request.user`, typed as `AuthenticatedUser`.
 * Downstream code (`@CurrentUser()`, `TenantContextInterceptor`) reads it
 * from there. The raw session id (`payload.sid`) is ALSO stashed on
 * `request.sessionId` so controllers that need it (e.g.
 * `/users/me/change-password`) can read it without altering the shared
 * `AuthenticatedUser` interface.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'yellowladder-jwt') {
  constructor(private readonly config: YellowladderConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtAccessSecret,
      algorithms: ['HS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtAccessTokenPayload): Promise<AuthenticatedUser> {
    if (!payload || payload.tokenType !== 'access' || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    // Stash the raw session id on the request object. `AuthenticatedUser`
    // (shared/types) intentionally does not carry `sid` — it is an
    // auth-only concern — so we keep it here instead of mutating the
    // interface.
    (req as Request & { sessionId?: string }).sessionId = payload.sid;
    // NOTE: We return a minimal shape here. Domain services may re-hydrate
    // from the DB when they need the full `AuthenticatedUser` (e.g. profile
    // screens). For guard / scope checks, the JWT claims are sufficient.
    return {
      id: payload.sub,
      email: payload.email,
      firstName: null,
      lastName: null,
      phoneE164: '',
      phoneCountryCode: '',
      countryCode: '',
      role: payload.role,
      companyId: payload.companyId,
      shopIds: payload.shopIds,
      emailVerified: payload.emailVerified,
      onboardingPhase: payload.onboardingPhase,
      profilePhotoUrl: null,
      createdAt: '',
      updatedAt: '',
    };
  }
}
