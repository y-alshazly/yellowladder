import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import type { AuthenticatedUser, PaymentMethodPreferenceOption } from '@yellowladder/shared-types';
import { Permissions } from '@yellowladder/shared-types';
import { PaymentMethodsRepository } from './config-lookups.repository';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly repository: PaymentMethodsRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getMany(user: AuthenticatedUser): Promise<readonly PaymentMethodPreferenceOption[]> {
    this.authorizationService.requirePermission(user, Permissions.PaymentMethodsRead);
    return this.getManyPublic();
  }

  async getManyPublic(): Promise<readonly PaymentMethodPreferenceOption[]> {
    const rows = await this.repository.findMany();
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.labelEn,
      labelKey: row.labelKey,
      description: row.descriptionEn,
      sortOrder: row.sortOrder,
    }));
  }
}
