import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { CompaniesHouseService as CompaniesHouseInfraService } from '@yellowladder/backend-infra-companies-house';
import type {
  AuthenticatedUser,
  CompaniesHouseLookupResponse,
  CompaniesHouseSearchResponse,
} from '@yellowladder/shared-types';
import { Permissions } from '@yellowladder/shared-types';

/**
 * Domain-layer service sitting in front of the infra HTTP client. Enforces
 * RBAC, normalises query params, and surfaces clean domain DTOs to the
 * controller. The infra client owns caching / circuit breaker / upstream
 * auth.
 */
@Injectable()
export class CompaniesHouseDomainService {
  constructor(
    private readonly infraClient: CompaniesHouseInfraService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async search(
    user: AuthenticatedUser,
    query: string,
    page?: number,
    pageSize?: number,
  ): Promise<CompaniesHouseSearchResponse> {
    this.authorizationService.requirePermission(user, Permissions.CompaniesHouseSearch);
    return this.searchPublic(query, page, pageSize);
  }

  async searchPublic(
    query: string,
    page?: number,
    pageSize?: number,
  ): Promise<CompaniesHouseSearchResponse> {
    return this.infraClient.searchByName(query, page ?? 1, pageSize ?? 20);
  }

  async lookup(
    user: AuthenticatedUser,
    registrationNumber: string,
  ): Promise<CompaniesHouseLookupResponse> {
    this.authorizationService.requirePermission(user, Permissions.CompaniesHouseLookup);
    return this.lookupPublic(registrationNumber);
  }

  async lookupPublic(registrationNumber: string): Promise<CompaniesHouseLookupResponse> {
    return this.infraClient.fetchByNumber(registrationNumber);
  }
}
