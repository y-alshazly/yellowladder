import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@yellowladder/backend-infra-auth';
import type { AnnualTurnoverOption } from '@yellowladder/shared-types';
import { AnnualTurnoverBandsService } from './annual-turnover-bands.service';

@ApiTags('Annual Turnover Bands')
@Controller('annual-turnover-bands')
export class AnnualTurnoverBandsController {
  constructor(private readonly service: AnnualTurnoverBandsService) {}

  @Get()
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'List annual turnover band options' })
  async getMany(): Promise<readonly AnnualTurnoverOption[]> {
    return this.service.getManyPublic();
  }
}
