import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import type { AuthenticatedUser, BusinessCategoryOption } from '@yellowladder/shared-types';
import { Permissions } from '@yellowladder/shared-types';
import { BusinessCategoriesRepository } from './config-lookups.repository';

@Injectable()
export class BusinessCategoriesService {
  constructor(
    private readonly repository: BusinessCategoriesRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getMany(user: AuthenticatedUser): Promise<readonly BusinessCategoryOption[]> {
    this.authorizationService.requirePermission(user, Permissions.BusinessCategoriesRead);
    return this.getManyPublic();
  }

  async getManyPublic(): Promise<readonly BusinessCategoryOption[]> {
    const rows = await this.repository.findMany();
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.labelEn,
      labelKey: row.labelKey,
      iconName: row.iconName,
      sortOrder: row.sortOrder,
    }));
  }
}
