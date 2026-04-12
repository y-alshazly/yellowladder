import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateUserInput = Omit<
  Prisma.UserUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'emailNormalised'
>;

/**
 * User writes performed by the authentication + users sub-modules. Keeping
 * the repository here (and re-exporting from `users` as well) avoids a
 * circular dep during Phase A → B where the authentication service writes
 * the initial user row without Users being wired yet.
 */
@Injectable()
export class AuthenticationUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOneByEmailNormalised(emailNormalised: string) {
    return this.prisma.user.findFirst({ where: { emailNormalised } });
  }

  async findOneById(id: string) {
    return this.prisma.user.findFirst({ where: { id } });
  }

  async createOne(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        ...input,
        emailNormalised: input.email.toLowerCase(),
      },
    });
  }

  async markEmailVerified(userId: string, verifiedAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: verifiedAt,
        onboardingPhase: 'PHASE_B_VERIFIED',
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string, changedAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: changedAt,
      },
    });
  }
}
