import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@yellowladder/backend-identity-authorization';
import { DatabaseModule } from '@yellowladder/backend-infra-database';
import { ItemPurchaseCountsRepository } from './item-purchase-counts.repository';
import { ItemPurchaseCountsService } from './item-purchase-counts.service';

@Module({
  imports: [DatabaseModule, AuthorizationModule],
  providers: [ItemPurchaseCountsService, ItemPurchaseCountsRepository],
  exports: [ItemPurchaseCountsService],
})
export class ItemPurchaseCountsModule {}
