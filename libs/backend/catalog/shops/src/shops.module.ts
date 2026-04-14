import { Module } from '@nestjs/common';
import { AuditModule } from '@yellowladder/backend-identity-audit';
import { AuthorizationModule } from '@yellowladder/backend-identity-authorization';
import { DatabaseModule } from '@yellowladder/backend-infra-database';
import { ShopsController } from './shops.controller';
import { ShopsRepository } from './shops.repository';
import { ShopsService } from './shops.service';

@Module({
  imports: [DatabaseModule, AuthorizationModule, AuditModule],
  controllers: [ShopsController],
  providers: [ShopsService, ShopsRepository],
  exports: [ShopsService, ShopsRepository],
})
export class ShopsModule {}
