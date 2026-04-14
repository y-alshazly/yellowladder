import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

/**
 * Plain override fields accepted from the service layer.
 * These are simple JS values (not Prisma field-update wrappers),
 * compatible with both the create and update branches of upsert.
 */
export interface ShopCategoryOverrideFields {
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
}

export type UpdateShopCategoryInput = ShopCategoryOverrideFields;

@Injectable()
export class ShopCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.ShopCategoryWhereInput) {
    return this.prisma.shopCategory.findFirst({ where });
  }

  async findMany(where: Prisma.ShopCategoryWhereInput) {
    return this.prisma.shopCategory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertOne(
    shopId: string,
    categoryId: string,
    companyId: string,
    input: ShopCategoryOverrideFields,
  ) {
    return this.prisma.shopCategory.upsert({
      where: { shopId_categoryId: { shopId, categoryId } },
      create: {
        shopId,
        categoryId,
        companyId,
        ...input,
      },
      update: input,
    });
  }

  async deleteOne(shopId: string, categoryId: string) {
    return this.prisma.shopCategory.delete({
      where: { shopId_categoryId: { shopId, categoryId } },
    });
  }
}
