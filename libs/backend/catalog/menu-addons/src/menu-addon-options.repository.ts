import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateMenuAddonOptionInput = Omit<
  Prisma.MenuAddonOptionUncheckedCreateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

export type UpdateMenuAddonOptionInput = Partial<
  Omit<
    Prisma.MenuAddonOptionUncheckedUpdateInput,
    'id' | 'companyId' | 'menuAddonId' | 'createdAt' | 'updatedAt'
  >
>;

@Injectable()
export class MenuAddonOptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.MenuAddonOptionWhereInput) {
    return this.prisma.menuAddonOption.findFirst({ where });
  }

  async findMany(
    where: Prisma.MenuAddonOptionWhereInput,
    skip: number,
    take: number,
    orderBy:
      | Prisma.MenuAddonOptionOrderByWithRelationInput
      | Prisma.MenuAddonOptionOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.menuAddonOption.findMany({ where, skip, take, orderBy }),
      this.prisma.menuAddonOption.count({ where }),
    ]);
    return { items, total };
  }

  async createOne(input: CreateMenuAddonOptionInput & { companyId: string }) {
    return this.prisma.menuAddonOption.create({ data: input });
  }

  async updateOne(id: string, input: UpdateMenuAddonOptionInput) {
    return this.prisma.menuAddonOption.update({ where: { id }, data: input });
  }

  async deleteOne(id: string) {
    return this.prisma.menuAddonOption.delete({ where: { id } });
  }
}
