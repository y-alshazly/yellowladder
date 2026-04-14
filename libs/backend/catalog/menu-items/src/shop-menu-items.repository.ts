import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateShopMenuItemInput = Omit<
  Prisma.ShopMenuItemUncheckedCreateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

/**
 * Plain override fields accepted from the service layer.
 * These are simple JS values (not Prisma field-update wrappers),
 * compatible with both the create and update branches of upsert.
 */
export interface ShopMenuItemOverrideFields {
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  basePrice?: number | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
}

export type UpdateShopMenuItemInput = ShopMenuItemOverrideFields;

@Injectable()
export class ShopMenuItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.ShopMenuItemWhereInput) {
    return this.prisma.shopMenuItem.findFirst({ where });
  }

  async findMany(
    where: Prisma.ShopMenuItemWhereInput,
    skip: number,
    take: number,
    orderBy:
      | Prisma.ShopMenuItemOrderByWithRelationInput
      | Prisma.ShopMenuItemOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.shopMenuItem.findMany({ where, skip, take, orderBy }),
      this.prisma.shopMenuItem.count({ where }),
    ]);
    return { items, total };
  }

  async createOne(input: CreateShopMenuItemInput & { companyId: string }) {
    return this.prisma.shopMenuItem.create({ data: input });
  }

  async upsertOne(
    shopId: string,
    menuItemId: string,
    companyId: string,
    input: ShopMenuItemOverrideFields,
  ) {
    return this.prisma.shopMenuItem.upsert({
      where: { shopId_menuItemId: { shopId, menuItemId } },
      create: {
        shopId,
        menuItemId,
        companyId,
        ...input,
      },
      update: input,
    });
  }

  async updateOne(id: string, input: UpdateShopMenuItemInput) {
    return this.prisma.shopMenuItem.update({ where: { id }, data: input });
  }

  async deleteOne(id: string) {
    return this.prisma.shopMenuItem.delete({ where: { id } });
  }

  async count(where: Prisma.ShopMenuItemWhereInput) {
    return this.prisma.shopMenuItem.count({ where });
  }
}
