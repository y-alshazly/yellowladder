import { Module } from '@nestjs/common';
import { AuditModule } from '@yellowladder/backend-identity-audit';
import { AuthenticationModule } from '@yellowladder/backend-identity-authentication';
import { AuthorizationModule } from '@yellowladder/backend-identity-authorization';
import { CompaniesHouseInfraModule } from '@yellowladder/backend-infra-companies-house';
import { DatabaseModule } from '@yellowladder/backend-infra-database';
import { DomainEventsModule } from '@yellowladder/backend-infra-events';
import { AnnualTurnoverBandsController } from './annual-turnover-bands.controller';
import { AnnualTurnoverBandsService } from './annual-turnover-bands.service';
import { BusinessCategoriesController } from './business-categories.controller';
import { BusinessCategoriesService } from './business-categories.service';
import { BusinessTypesController } from './business-types.controller';
import { BusinessTypesService } from './business-types.service';
import { CompaniesHouseController } from './companies-house.controller';
import { CompaniesHouseDomainService } from './companies-house.service';
import { CompaniesController } from './companies.controller';
import { CompaniesRepository } from './companies.repository';
import { CompaniesService } from './companies.service';
import {
  AnnualTurnoverBandsRepository,
  BusinessCategoriesRepository,
  BusinessTypesRepository,
  PaymentMethodsRepository,
} from './config-lookups.repository';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';

@Module({
  imports: [
    DatabaseModule,
    AuthorizationModule,
    AuditModule,
    DomainEventsModule,
    AuthenticationModule,
    CompaniesHouseInfraModule,
  ],
  controllers: [
    CompaniesController,
    CompaniesHouseController,
    BusinessTypesController,
    BusinessCategoriesController,
    AnnualTurnoverBandsController,
    PaymentMethodsController,
  ],
  providers: [
    CompaniesService,
    CompaniesRepository,
    CompaniesHouseDomainService,
    BusinessTypesService,
    BusinessTypesRepository,
    BusinessCategoriesService,
    BusinessCategoriesRepository,
    AnnualTurnoverBandsService,
    AnnualTurnoverBandsRepository,
    PaymentMethodsService,
    PaymentMethodsRepository,
  ],
  exports: [CompaniesService, CompaniesRepository],
})
export class CompaniesModule {}
