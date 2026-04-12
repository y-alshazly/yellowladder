import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import type { AuthenticatedUser, BusinessTypeOption } from '@yellowladder/shared-types';
import { Permissions } from '@yellowladder/shared-types';
import { BusinessTypesRepository } from './config-lookups.repository';

@Injectable()
export class BusinessTypesService {
  constructor(
    private readonly repository: BusinessTypesRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getMany(user: AuthenticatedUser): Promise<readonly BusinessTypeOption[]> {
    this.authorizationService.requirePermission(user, Permissions.BusinessTypesRead);
    const rows = await this.repository.findMany();
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.labelEn,
      labelKey: row.labelKey,
      sortOrder: row.sortOrder,
    }));
  }
}
