import { Injectable } from '@nestjs/common';
import { PrismaService } from '@yellowladder/backend-infra-database';

export interface CreateOtpRecordInput {
  userId: string;
  email: string;
  purpose: string;
  codeHash: string;
  expiresAt: Date;
}

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOne(input: CreateOtpRecordInput) {
    return this.prisma.otpRecord.create({
      data: {
        userId: input.userId,
        email: input.email,
        purpose: input.purpose,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
      },
    });
  }

  async countByEmailSince(email: string, since: Date): Promise<number> {
    return this.prisma.otpRecord.count({
      where: {
        email,
        createdAt: { gte: since },
      },
    });
  }

  async findLatestActive(userId: string, purpose: string) {
    return this.prisma.otpRecord.findFirst({
      where: {
        userId,
        purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementAttempts(id: string) {
    return this.prisma.otpRecord.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async markConsumed(id: string, consumedAt: Date) {
    return this.prisma.otpRecord.update({
      where: { id },
      data: { consumedAt },
    });
  }
}
