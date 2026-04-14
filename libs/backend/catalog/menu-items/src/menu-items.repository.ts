import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateMenuItemInput = Omit<
  Prisma.MenuItemUncheckedCreateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

export type UpdateMenuItemInput = Partial<
  Omit<Prisma.MenuItemUncheckedUpdateInput, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>
>;

@Injectable()
export class MenuItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.MenuItemWhereInput, include?: Prisma.MenuItemInclude) {
    return this.prisma.menuItem.findFirst({ where, include });
  }

  async findMany(
    where: Prisma.MenuItemWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.MenuItemOrderByWithRelationInput | Prisma.MenuItemOrderByWithRelationInput[],
    include?: Prisma.MenuItemInclude,
  ) {
    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({ where, skip, take, orderBy, include }),
      this.prisma.menuItem.count({ where }),
    ]);
    return { items, total };
  }

  async createOne(input: CreateMenuItemInput & { companyId: string }) {
    return this.prisma.menuItem.create({ data: input });
  }

  async updateOne(id: string, input: UpdateMenuItemInput) {
    return this.prisma.menuItem.update({ where: { id }, data: input });
  }

  async deleteOne(id: string) {
    return this.prisma.menuItem.delete({ where: { id } });
  }

  async count(where: Prisma.MenuItemWhereInput) {
    return this.prisma.menuItem.count({ where });
  }
}
