import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateShopMenuAddonInput = Omit<
  Prisma.ShopMenuAddonUncheckedCreateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

/**
 * Plain override fields accepted from the service layer.
 * These are simple JS values (not Prisma field-update wrappers),
 * compatible with both the create and update branches of upsert.
 */
export interface ShopMenuAddonOverrideFields {
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  isMultiSelect?: boolean | null;
  isRequired?: boolean | null;
  maxSelections?: number | null;
  sortOrder?: number | null;
}

export type UpdateShopMenuAddonInput = ShopMenuAddonOverrideFields;

@Injectable()
export class ShopMenuAddonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.ShopMenuAddonWhereInput) {
    return this.prisma.shopMenuAddon.findFirst({ where });
  }

  async findMany(
    where: Prisma.ShopMenuAddonWhereInput,
    skip: number,
    take: number,
    orderBy:
      | Prisma.ShopMenuAddonOrderByWithRelationInput
      | Prisma.ShopMenuAddonOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.shopMenuAddon.findMany({ where, skip, take, orderBy }),
      this.prisma.shopMenuAddon.count({ where }),
    ]);
    return { items, total };
  }

  async upsertOne(
    shopId: string,
    menuAddonId: string,
    companyId: string,
    input: ShopMenuAddonOverrideFields,
  ) {
    return this.prisma.shopMenuAddon.upsert({
      where: { shopId_menuAddonId: { shopId, menuAddonId } },
      create: {
        shopId,
        menuAddonId,
        companyId,
        ...input,
      },
      update: input,
    });
  }

  async deleteOne(id: string) {
    return this.prisma.shopMenuAddon.delete({ where: { id } });
  }

  async deleteByShopAndAddon(shopId: string, menuAddonId: string) {
    return this.prisma.shopMenuAddon.delete({
      where: { shopId_menuAddonId: { shopId, menuAddonId } },
    });
  }
}
