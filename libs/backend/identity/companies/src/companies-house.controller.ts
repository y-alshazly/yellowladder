import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@yellowladder/backend-infra-auth';
import type {
  CompaniesHouseLookupResponse,
  CompaniesHouseSearchResponse,
} from '@yellowladder/shared-types';
import { CompaniesHouseDomainService } from './companies-house.service';
import { CompaniesHouseLookupRequestDto } from './dtos/companies-house-lookup-request.dto';
import { CompaniesHouseSearchRequestDto } from './dtos/companies-house-search-request.dto';

@ApiTags('Companies House')
@Controller('companies-house')
export class CompaniesHouseController {
  constructor(private readonly companiesHouseService: CompaniesHouseDomainService) {}

  @Get('search')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'Search Companies House by name or number' })
  async search(
    @Query() query: CompaniesHouseSearchRequestDto,
  ): Promise<CompaniesHouseSearchResponse> {
    return this.companiesHouseService.searchPublic(query.query, query.page, query.pageSize);
  }

  @Get(':registrationNumber')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'Fetch a company profile + PSCs by registration number' })
  async lookup(
    @Param() params: CompaniesHouseLookupRequestDto,
  ): Promise<CompaniesHouseLookupResponse> {
    return this.companiesHouseService.lookupPublic(params.registrationNumber);
  }
}
