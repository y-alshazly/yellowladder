import { Module } from '@nestjs/common';
import { AuditModule } from '@yellowladder/backend-identity-audit';
import { AuthenticationModule } from '@yellowladder/backend-identity-authentication';
import { AuthorizationModule } from '@yellowladder/backend-identity-authorization';
import { DatabaseModule } from '@yellowladder/backend-infra-database';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule, AuthorizationModule, AuditModule, AuthenticationModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
