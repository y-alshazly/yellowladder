import { Module } from '@nestjs/common';
import { AuditModule } from '@yellowladder/backend-identity-audit';
import { AuthorizationModule } from '@yellowladder/backend-identity-authorization';
import { DatabaseModule } from '@yellowladder/backend-infra-database';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { ShopCategoriesController } from './shop-categories.controller';
import { ShopCategoriesRepository } from './shop-categories.repository';
import { ShopCategoriesService } from './shop-categories.service';

@Module({
  imports: [DatabaseModule, AuthorizationModule, AuditModule],
  controllers: [CategoriesController, ShopCategoriesController],
  providers: [
    CategoriesService,
    CategoriesRepository,
    ShopCategoriesService,
    ShopCategoriesRepository,
  ],
  exports: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}
