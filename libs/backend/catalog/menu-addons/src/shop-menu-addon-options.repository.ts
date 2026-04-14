import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateShopMenuAddonOptionInput = Omit<
  Prisma.ShopMenuAddonOptionUncheckedCreateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

/**
 * Plain override fields accepted from the service layer.
 * These are simple JS values (not Prisma field-update wrappers),
 * compatible with both the create and update branches of upsert.
 */
export interface ShopMenuAddonOptionOverrideFields {
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  priceModifier?: number | null;
  colorHex?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
}

export type UpdateShopMenuAddonOptionInput = ShopMenuAddonOptionOverrideFields;

@Injectable()
export class ShopMenuAddonOptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.ShopMenuAddonOptionWhereInput) {
    return this.prisma.shopMenuAddonOption.findFirst({ where });
  }

  async findMany(
    where: Prisma.ShopMenuAddonOptionWhereInput,
    skip: number,
    take: number,
    orderBy:
      | Prisma.ShopMenuAddonOptionOrderByWithRelationInput
      | Prisma.ShopMenuAddonOptionOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.shopMenuAddonOption.findMany({ where, skip, take, orderBy }),
      this.prisma.shopMenuAddonOption.count({ where }),
    ]);
    return { items, total };
  }

  async upsertOne(
    shopId: string,
    menuAddonOptionId: string,
    companyId: string,
    input: ShopMenuAddonOptionOverrideFields,
  ) {
    return this.prisma.shopMenuAddonOption.upsert({
      where: { shopId_menuAddonOptionId: { shopId, menuAddonOptionId } },
      create: {
        shopId,
        menuAddonOptionId,
        companyId,
        ...input,
      },
      update: input,
    });
  }

  async deleteOne(id: string) {
    return this.prisma.shopMenuAddonOption.delete({ where: { id } });
  }

  async deleteByShopAndOption(shopId: string, menuAddonOptionId: string) {
    return this.prisma.shopMenuAddonOption.delete({
      where: { shopId_menuAddonOptionId: { shopId, menuAddonOptionId } },
    });
  }
}
