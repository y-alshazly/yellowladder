import { Injectable } from '@nestjs/common';
import { PrismaService } from '@yellowladder/backend-infra-database';

/**
 * Shared repository for the four config enum tables. Each method returns
 * the full Prisma row — the sibling services map to DTOs.
 */
@Injectable()
export class BusinessTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany() {
    return this.prisma.businessType.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOneById(id: string) {
    return this.prisma.businessType.findFirst({ where: { id } });
  }

  async findOneByCode(code: string) {
    return this.prisma.businessType.findFirst({ where: { code } });
  }
}

@Injectable()
export class BusinessCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany() {
    return this.prisma.businessCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOneById(id: string) {
    return this.prisma.businessCategory.findFirst({ where: { id } });
  }
}

@Injectable()
export class AnnualTurnoverBandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany() {
    return this.prisma.annualTurnoverBand.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOneById(id: string) {
    return this.prisma.annualTurnoverBand.findFirst({ where: { id } });
  }
}

@Injectable()
export class PaymentMethodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany() {
    return this.prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOneById(id: string) {
    return this.prisma.paymentMethod.findFirst({ where: { id } });
  }
}
