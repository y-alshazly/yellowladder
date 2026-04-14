import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
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
import { UpdateCompanyDto } from './dtos/update-company.dto';

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
    if (idempotencyKeyHeader && idempotencyKeyHeader !== dto.idempotencyKey) {
      throw new BadRequestException(
        'Idempotency-Key header does not match idempotencyKey field in body',
      );
    }
    if (!idempotencyKeyHeader && !dto.idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    if (idempotencyKeyHeader) {
      dto.idempotencyKey = idempotencyKeyHeader;
    }
    return this.companiesService.createOne(user, CreateCompanyRequestDto.toInput(dto), {
      remoteIp: this.extractIp(req),
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get('me')
  @RequirePermission(Permissions.CompaniesRead)
  async getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.getOne(user);
  }

  @Patch('me')
  @RequirePermission(Permissions.CompaniesUpdate)
  @AuditLog({ action: 'Update', resource: 'Company' })
  async updateOwn(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateOne(user, UpdateCompanyDto.toInput(dto));
  }

  @Post('me/deactivate')
  @RequirePermission(Permissions.CompaniesUpdate)
  @AuditLog({ action: 'Deactivate', resource: 'Company' })
  async deactivateOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.deactivateOne(user);
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
