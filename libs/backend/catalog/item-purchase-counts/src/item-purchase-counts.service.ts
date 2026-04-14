import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { Permissions, type AuthenticatedUser } from '@yellowladder/shared-types';
import { ItemPurchaseCountsRepository } from './item-purchase-counts.repository';

@Injectable()
export class ItemPurchaseCountsService {
  constructor(
    private readonly repository: ItemPurchaseCountsRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  /**
   * Get top-selling items for a shop, ordered by purchase count descending.
   */
  async getTopItems(user: AuthenticatedUser, shopId: string, limit = 20) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsRead);
    this.authorizationService.assertShopAccess(user, shopId);

    return this.repository.findMany({ shopId }, { count: 'desc' }, limit);
  }

  /**
   * Increment purchase count for a menu item at a shop.
   * Called by the Ordering.OrderConfirmed domain event handler.
   * Must be idempotent — callers are responsible for deduplication.
   */
  async increment(companyId: string, shopId: string, menuItemId: string, quantity: number) {
    return this.repository.upsertCount(companyId, shopId, menuItemId, quantity);
  }

  /**
   * Decrement purchase count (e.g., on order cancellation).
   * Called by the Ordering.OrderCancelled domain event handler.
   */
  async decrement(shopId: string, menuItemId: string, quantity: number) {
    return this.repository.decrementCount(shopId, menuItemId, quantity);
  }
}
