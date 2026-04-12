import { Module } from '@nestjs/common';
import { YellowladderConfigModule } from '@yellowladder/backend-infra-config';
import { CompaniesHouseService } from './companies-house.service';

@Module({
  imports: [YellowladderConfigModule],
  providers: [CompaniesHouseService],
  exports: [CompaniesHouseService],
})
export class CompaniesHouseInfraModule {}
