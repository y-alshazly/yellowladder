import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { YellowladderConfigModule } from '@yellowladder/backend-infra-config';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';

/**
 * Exposes JWT plumbing for the Identity domain. The
 * `AuthenticationGuard`, `OptionalAuthenticationGuard`, and
 * `OnboardingPhaseGuard` are NOT registered here as providers — they are
 * registered as `APP_GUARD` instances in `apps/core-service/app.module.ts`
 * so they apply globally.
 */
@Module({
  imports: [
    YellowladderConfigModule,
    PassportModule.register({ defaultStrategy: 'yellowladder-jwt' }),
  ],
  providers: [TokenService, JwtStrategy],
  exports: [TokenService, JwtStrategy, PassportModule],
})
export class AuthInfraModule {}
