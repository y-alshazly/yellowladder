import { Injectable } from '@nestjs/common';
import { PrismaService } from '@yellowladder/backend-infra-database';

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  csrfHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOne(input: CreateRefreshTokenInput) {
    return this.prisma.refreshTokenRecord.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        csrfHash: input.csrfHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findOneByHash(tokenHash: string) {
    return this.prisma.refreshTokenRecord.findFirst({
      where: { tokenHash },
    });
  }

  async findOneById(id: string) {
    return this.prisma.refreshTokenRecord.findFirst({ where: { id } });
  }

  async markRotated(id: string, rotatedAt: Date) {
    return this.prisma.refreshTokenRecord.update({
      where: { id },
      data: { rotatedAt },
    });
  }

  async revoke(id: string) {
    return this.prisma.refreshTokenRecord.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async revokeAllForUser(userId: string) {
    return this.prisma.refreshTokenRecord.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async revokeAllExceptCurrent(userId: string, currentId: string) {
    return this.prisma.refreshTokenRecord.updateMany({
      where: {
        userId,
        revoked: false,
        NOT: { id: currentId },
      },
      data: { revoked: true },
    });
  }
}
