import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import type { AnnualTurnoverOption, AuthenticatedUser } from '@yellowladder/shared-types';
import { Permissions } from '@yellowladder/shared-types';
import { AnnualTurnoverBandsRepository } from './config-lookups.repository';

@Injectable()
export class AnnualTurnoverBandsService {
  constructor(
    private readonly repository: AnnualTurnoverBandsRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getMany(user: AuthenticatedUser): Promise<readonly AnnualTurnoverOption[]> {
    this.authorizationService.requirePermission(user, Permissions.AnnualTurnoverBandsRead);
    return this.getManyPublic();
  }

  async getManyPublic(): Promise<readonly AnnualTurnoverOption[]> {
    const rows = await this.repository.findMany();
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.labelEn,
      labelKey: row.labelKey,
      minAmountGbp: row.minAmountGbp,
      maxAmountGbp: row.maxAmountGbp,
      sortOrder: row.sortOrder,
    }));
  }
}
