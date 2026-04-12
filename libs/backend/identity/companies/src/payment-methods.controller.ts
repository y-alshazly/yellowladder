import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@yellowladder/backend-infra-auth';
import type { PaymentMethodPreferenceOption } from '@yellowladder/shared-types';
import { PaymentMethodsService } from './payment-methods.service';

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  @ApiOperation({ summary: 'List payment method preference options' })
  async getMany(): Promise<readonly PaymentMethodPreferenceOption[]> {
    return this.service.getManyPublic();
  }
}
