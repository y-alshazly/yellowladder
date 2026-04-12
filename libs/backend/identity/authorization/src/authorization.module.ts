import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  providers: [AuthorizationService, RolesGuard],
  exports: [AuthorizationService, RolesGuard],
})
export class AuthorizationModule {}
