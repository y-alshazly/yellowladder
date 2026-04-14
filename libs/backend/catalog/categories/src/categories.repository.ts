import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateCategoryInput = Omit<
  Prisma.CategoryUncheckedCreateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

export type UpdateCategoryInput = Partial<
  Omit<Prisma.CategoryUncheckedUpdateInput, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>
>;

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.findFirst({ where });
  }

  async findMany(
    where: Prisma.CategoryWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.category.findMany({ where, skip, take, orderBy }),
      this.prisma.category.count({ where }),
    ]);
    return { items, total };
  }

  async createOne(input: CreateCategoryInput & { companyId: string }) {
    return this.prisma.category.create({ data: input });
  }

  async updateOne(id: string, input: UpdateCategoryInput) {
    return this.prisma.category.update({ where: { id }, data: input });
  }

  async deleteOne(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  async count(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.count({ where });
  }

  async updateManySortOrder(updates: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      updates.map(({ id, sortOrder }) =>
        this.prisma.category.update({ where: { id }, data: { sortOrder } }),
      ),
    );
  }
}
