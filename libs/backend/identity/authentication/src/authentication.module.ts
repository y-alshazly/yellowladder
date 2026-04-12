import { Module } from '@nestjs/common';
import { AuditModule } from '@yellowladder/backend-identity-audit';
import { AuthorizationModule } from '@yellowladder/backend-identity-authorization';
import { AuthInfraModule } from '@yellowladder/backend-infra-auth';
import { YellowladderConfigModule } from '@yellowladder/backend-infra-config';
import { DatabaseModule } from '@yellowladder/backend-infra-database';
import { DomainEventsModule } from '@yellowladder/backend-infra-events';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { OtpRepository } from './otp.repository';
import { PasswordResetTokenRepository } from './password-reset.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { AuthenticationUsersRepository } from './users.repository';

@Module({
  imports: [
    DatabaseModule,
    YellowladderConfigModule,
    AuthInfraModule,
    AuthorizationModule,
    AuditModule,
    DomainEventsModule,
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    AuthenticationUsersRepository,
    OtpRepository,
    PasswordResetTokenRepository,
    RefreshTokenRepository,
  ],
  exports: [AuthenticationService, AuthenticationUsersRepository, RefreshTokenRepository],
})
export class AuthenticationModule {}
