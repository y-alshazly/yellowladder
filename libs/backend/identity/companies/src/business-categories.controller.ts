import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@yellowladder/backend-infra-auth';
import type { BusinessCategoryOption } from '@yellowladder/shared-types';
import { BusinessCategoriesService } from './business-categories.service';

@ApiTags('Business Categories')
@Controller('business-categories')
export class BusinessCategoriesController {
  constructor(private readonly service: BusinessCategoriesService) {}

  @Get()
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'List business category options' })
  async getMany(): Promise<readonly BusinessCategoryOption[]> {
    return this.service.getManyPublic();
  }
}
