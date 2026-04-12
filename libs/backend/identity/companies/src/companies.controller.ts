import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import {
  CurrentUser,
  RequireOnboardingPhase,
  RequirePermission,
} from '@yellowladder/backend-infra-auth';
import type { AuthenticatedUser, CreateCompanyResponse } from '@yellowladder/shared-types';
import { OnboardingPhase, Permissions } from '@yellowladder/shared-types';
import type { Request } from 'express';
import { CompaniesService } from './companies.service';
import { ApiCompanies } from './companies.swagger';
import { CreateCompanyRequestDto } from './dtos/create-company-request.dto';

@ApiCompanies()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @RequirePermission(Permissions.CompaniesCreate)
  @RequireOnboardingPhase(OnboardingPhase.PhaseBVerified)
  @ApiCompanies('createOne')
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.CREATED)
  @AuditLog({ action: 'Create', resource: 'Company' })
  async createOne(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCompanyRequestDto,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
  ): Promise<CreateCompanyResponse> {
    // Architect §1.3 / §3.10 / §6.3: `Idempotency-Key` MUST be provided as
    // an HTTP header. We accept a body field too for backwards-friendly
    // clients, but if both are present they must agree.
    if (idempotencyKeyHeader && idempotencyKeyHeader !== dto.idempotencyKey) {
      throw new BadRequestException(
        'Idempotency-Key header does not match idempotencyKey field in body',
      );
    }
    if (!idempotencyKeyHeader && !dto.idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    // Header is authoritative — override the body copy so downstream code
    // reads a single canonical key.
    if (idempotencyKeyHeader) {
      dto.idempotencyKey = idempotencyKeyHeader;
    }
    return this.companiesService.createOne(user, CreateCompanyRequestDto.toInput(dto), {
      remoteIp: this.extractIp(req),
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  private extractIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      const first = forwarded.split(',')[0];
      return first ? first.trim() : null;
    }
    return req.ip ?? null;
  }
}
