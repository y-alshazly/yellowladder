import { Injectable } from '@nestjs/common';
import { PrismaService } from '@yellowladder/backend-infra-database';

export interface CreatePasswordResetTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOne(input: CreatePasswordResetTokenInput) {
    return this.prisma.passwordResetToken.create({
      data: input,
    });
  }

  async findActiveByHash(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
      },
    });
  }

  async countByUserSince(userId: string, since: Date): Promise<number> {
    return this.prisma.passwordResetToken.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });
  }

  async markConsumed(id: string, consumedAt: Date) {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data: { consumedAt },
    });
  }
}
