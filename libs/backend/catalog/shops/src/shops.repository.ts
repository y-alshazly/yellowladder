import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

// Hand-written instead of Omit<Prisma.ShopUncheckedCreateInput, ...> because
// the `hours` field uses Record<string, unknown> at the service boundary and
// is cast to Prisma.InputJsonValue inside the repository methods.
export interface CreateShopInput {
  companyId: string;
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  addressCity: string;
  addressRegion?: string | null;
  addressPostcode: string;
  addressCountryCode: string;
  phone?: string | null;
  hours?: Record<string, unknown> | null;
  logoUrl?: string | null;
  isArchived?: boolean;
  sortOrder?: number;
  isMain?: boolean;
}

// See CreateShopInput comment above — same reason for hand-written type.
export interface UpdateShopInput {
  name?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  addressCity?: string;
  addressRegion?: string | null;
  addressPostcode?: string;
  addressCountryCode?: string;
  phone?: string | null;
  hours?: Record<string, unknown> | null;
  logoUrl?: string | null;
  isArchived?: boolean;
  sortOrder?: number;
  isMain?: boolean;
}

@Injectable()
export class ShopsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.ShopWhereInput) {
    return this.prisma.shop.findFirst({ where });
  }

  async findMany(
    where: Prisma.ShopWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ShopOrderByWithRelationInput | Prisma.ShopOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.shop.findMany({ where, skip, take, orderBy }),
      this.prisma.shop.count({ where }),
    ]);
    return { items, total };
  }

  async createOne(input: CreateShopInput) {
    return this.prisma.shop.create({
      data: {
        ...input,
        hours: input.hours as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async updateOne(id: string, input: UpdateShopInput) {
    return this.prisma.shop.update({
      where: { id },
      data: {
        ...input,
        hours: input.hours as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async updateManySortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map(({ id, sortOrder }) =>
        this.prisma.shop.update({ where: { id }, data: { sortOrder } }),
      ),
    );
  }

  async count(where: Prisma.ShopWhereInput) {
    return this.prisma.shop.count({ where });
  }
}
