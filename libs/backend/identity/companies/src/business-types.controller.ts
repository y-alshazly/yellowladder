import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  RequireOnboardingPhase,
  RequirePermission,
} from '@yellowladder/backend-infra-auth';
import type { AuthenticatedUser, BusinessTypeOption } from '@yellowladder/shared-types';
import { OnboardingPhase, Permissions } from '@yellowladder/shared-types';
import { BusinessTypesService } from './business-types.service';

@ApiTags('Business Types')
@ApiBearerAuth()
@Controller('business-types')
export class BusinessTypesController {
  constructor(private readonly service: BusinessTypesService) {}

  @Get()
  @RequirePermission(Permissions.BusinessTypesRead)
  @RequireOnboardingPhase(
    OnboardingPhase.PhaseARegistered,
    OnboardingPhase.PhaseBVerified,
    OnboardingPhase.PhaseCCompleted,
  )
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'List business type options' })
  async getMany(@CurrentUser() user: AuthenticatedUser): Promise<readonly BusinessTypeOption[]> {
    return this.service.getMany(user);
  }
}
