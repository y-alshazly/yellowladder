import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

@Injectable()
export class ItemPurchaseCountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.ItemPurchaseCountWhereInput) {
    return this.prisma.itemPurchaseCount.findFirst({ where });
  }

  async findMany(
    where: Prisma.ItemPurchaseCountWhereInput,
    orderBy:
      | Prisma.ItemPurchaseCountOrderByWithRelationInput
      | Prisma.ItemPurchaseCountOrderByWithRelationInput[] = { count: 'desc' },
    take?: number,
  ) {
    return this.prisma.itemPurchaseCount.findMany({ where, orderBy, take });
  }

  async upsertCount(companyId: string, shopId: string, menuItemId: string, incrementBy: number) {
    return this.prisma.itemPurchaseCount.upsert({
      where: {
        shopId_menuItemId: { shopId, menuItemId },
      },
      create: {
        companyId,
        shopId,
        menuItemId,
        count: incrementBy,
      },
      update: {
        count: { increment: incrementBy },
      },
    });
  }

  async decrementCount(shopId: string, menuItemId: string, decrementBy: number) {
    const existing = await this.prisma.itemPurchaseCount.findUnique({
      where: { shopId_menuItemId: { shopId, menuItemId } },
    });
    if (!existing || existing.count <= 0) return;

    const newCount = Math.max(0, existing.count - decrementBy);
    return this.prisma.itemPurchaseCount.update({
      where: { shopId_menuItemId: { shopId, menuItemId } },
      data: { count: newCount },
    });
  }
}
