import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateMenuAddonInput = Omit<
  Prisma.MenuAddonUncheckedCreateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

export type UpdateMenuAddonInput = Partial<
  Omit<
    Prisma.MenuAddonUncheckedUpdateInput,
    'id' | 'companyId' | 'menuItemId' | 'createdAt' | 'updatedAt'
  >
>;

@Injectable()
export class MenuAddonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.MenuAddonWhereInput) {
    return this.prisma.menuAddon.findFirst({ where, include: { options: true } });
  }

  async findMany(
    where: Prisma.MenuAddonWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.MenuAddonOrderByWithRelationInput | Prisma.MenuAddonOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.menuAddon.findMany({ where, skip, take, orderBy, include: { options: true } }),
      this.prisma.menuAddon.count({ where }),
    ]);
    return { items, total };
  }

  async createOne(input: CreateMenuAddonInput & { companyId: string }) {
    return this.prisma.menuAddon.create({ data: input, include: { options: true } });
  }

  async updateOne(id: string, input: UpdateMenuAddonInput) {
    return this.prisma.menuAddon.update({ where: { id }, data: input, include: { options: true } });
  }

  async deleteOne(id: string) {
    return this.prisma.menuAddon.delete({ where: { id } });
  }

  async count(where: Prisma.MenuAddonWhereInput) {
    return this.prisma.menuAddon.count({ where });
  }
}
