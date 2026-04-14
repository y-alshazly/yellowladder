import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

// ---------------------------------------------------------------------------
// Named input types
// ---------------------------------------------------------------------------

export type UpdateUserProfileInput = Pick<
  Prisma.UserUncheckedUpdateInput,
  'firstName' | 'lastName' | 'phoneE164' | 'phoneCountryCode'
>;

export interface CreateTeamMemberInput {
  email: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  phoneCountryCode: string;
  countryCode: string;
  role: string;
  shopIds: string[];
  password: string;
}

export interface UpdateTeamMemberInput {
  firstName?: string;
  lastName?: string;
  phoneE164?: string;
  phoneCountryCode?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Return type for queries that include shop relations
// ---------------------------------------------------------------------------

export type UserWithShops = Prisma.UserGetPayload<{
  include: { userShops: { include: { shop: true } } };
}>;

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Existing methods (self-service) ------------------------------------

  async findOne(where: Prisma.UserWhereInput) {
    return this.prisma.user.findFirst({ where });
  }

  async updateProfile(userId: string, input: UpdateUserProfileInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: input,
    });
  }

  // ---- Team management methods --------------------------------------------

  async findOneWithShops(where: Prisma.UserWhereInput): Promise<UserWithShops | null> {
    return this.prisma.user.findFirst({
      where,
      include: { userShops: { include: { shop: true } } },
    });
  }

  async findManyWithShops(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[],
  ): Promise<{ items: UserWithShops[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { userShops: { include: { shop: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async createTeamMember(input: {
    email: string;
    emailNormalised: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phoneE164: string;
    phoneCountryCode: string;
    countryCode: string;
    role: string;
    companyId: string;
    onboardingPhase: string;
    status: string;
    shopIds: string[];
  }): Promise<UserWithShops> {
    const { shopIds, ...userData } = input;
    return this.prisma.user.create({
      data: {
        ...userData,
        userShops: {
          create: shopIds.map((shopId) => ({ shopId })),
        },
      },
      include: { userShops: { include: { shop: true } } },
    });
  }

  async updateTeamMember(
    userId: string,
    input: Partial<
      Pick<
        Prisma.UserUncheckedUpdateInput,
        'firstName' | 'lastName' | 'phoneE164' | 'phoneCountryCode' | 'email' | 'emailNormalised'
      >
    >,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: input,
    });
  }

  async softDeleteOne(userId: string): Promise<void> {
    const now = new Date();
    const deletedSuffix = `_deleted_${now.getTime()}`;
    await this.prisma.$transaction([
      this.prisma.userShop.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.Deleted,
          deletedAt: now,
          // Suffix emailNormalised to free the unique constraint so the
          // email address can be reused by a new account if needed.
          emailNormalised: `${userId}${deletedSuffix}`,
        },
      }),
    ]);
  }

  async updateRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async replaceShopAssignments(userId: string, shopIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userShop.deleteMany({ where: { userId } }),
      ...shopIds.map((shopId) => this.prisma.userShop.create({ data: { userId, shopId } })),
    ]);
  }

  async countActiveCompanyAdmins(companyId: string, excludeUserId?: string): Promise<number> {
    const where: Prisma.UserWhereInput = {
      companyId,
      role: UserRole.CompanyAdmin,
      status: { not: UserStatus.Deleted },
    };
    if (excludeUserId) {
      where.id = { not: excludeUserId };
    }
    return this.prisma.user.count({ where });
  }

  async findShopIdsByCompanyId(companyId: string): Promise<string[]> {
    const shops = await this.prisma.shop.findMany({
      where: { companyId },
      select: { id: true },
    });
    return shops.map((shop) => shop.id);
  }
}
