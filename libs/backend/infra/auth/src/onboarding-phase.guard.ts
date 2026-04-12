import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '@yellowladder/shared-types';
import { IdentityAuthenticationErrors } from '@yellowladder/shared-types';
import { IS_PUBLIC_KEY } from './public.decorator';
import {
  REQUIRE_ONBOARDING_PHASE_KEY,
  type OnboardingPhaseGate,
} from './require-onboarding-phase.decorator';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

/**
 * Restricts an endpoint to users whose onboarding phase sits in a declared
 * allowlist. Implements architect §2.5 — the "user without company" window.
 *
 * Rules (fail-closed allowlist model, per review [M-1]):
 *   - `@Public()` endpoints are skipped entirely.
 *   - Unauthenticated requests pass through (the `AuthenticationGuard` is
 *     authoritative on whether a route requires auth — we do not second
 *     guess it here).
 *   - An `ACTIVE` user (i.e. `companyId` is populated, Phase C finished)
 *     passes every phase gate unconditionally. This keeps downstream
 *     feature controllers free of mandatory `@RequireOnboardingPhase` on
 *     every new endpoint.
 *   - For a non-active user:
 *     * If the endpoint declares `@RequireOnboardingPhase(...)` and the
 *       user's current phase is in the list, allow.
 *     * Otherwise, DENY. No implicit fallthrough — this is the defence
 *       against Phase A/B users reaching endpoints that forgot to annotate
 *       their required phase.
 */
@Injectable()
export class OnboardingPhaseGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      // AuthenticationGuard is authoritative on this. If a route reached
      // this guard without an authenticated user, the route is either
      // marked `@Public()` (already handled above) or the auth chain is
      // misconfigured. Allowing here means the request proceeds to
      // whichever guard next rejects it, which is the correct behaviour.
      return true;
    }

    // ACTIVE users bypass every phase gate. "ACTIVE" is an architect-level
    // synthetic phase meaning `companyId` is populated.
    if (user.companyId) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<readonly OnboardingPhaseGate[] | undefined>(
      REQUIRE_ONBOARDING_PHASE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      // Endpoint did not opt in to Phase A/B visibility. Deny.
      throw new ForbiddenException({
        errorCode: IdentityAuthenticationErrors.OnboardingPhaseForbidden,
        message: 'Endpoint not available until onboarding is complete',
      });
    }

    const userPhase: OnboardingPhaseGate = user.onboardingPhase;
    if (required.includes(userPhase)) {
      return true;
    }

    throw new ForbiddenException({
      errorCode: IdentityAuthenticationErrors.OnboardingPhaseForbidden,
      message: `This endpoint is not available at onboarding phase ${userPhase}`,
    });
  }
}
