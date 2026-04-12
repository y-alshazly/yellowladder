import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '@yellowladder/backend-infra-database';
import { CompaniesHouseErrors } from '@yellowladder/shared-types';

export class CompaniesHouseUnavailableException extends BusinessException {
  constructor(message = 'Companies House service is unavailable') {
    super(CompaniesHouseErrors.Unavailable, message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class CompaniesHouseRateLimitedException extends BusinessException {
  constructor(message = 'Companies House service is temporarily rate limited') {
    super(CompaniesHouseErrors.RateLimited, message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class CompaniesHouseNotFoundException extends BusinessException {
  constructor(message = 'Company not found on Companies House') {
    super(CompaniesHouseErrors.NotFound, message, HttpStatus.NOT_FOUND);
  }
}
