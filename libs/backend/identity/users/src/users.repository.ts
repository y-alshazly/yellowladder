import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type UpdateUserProfileInput = Pick<
  Prisma.UserUncheckedUpdateInput,
  'firstName' | 'lastName' | 'phoneE164' | 'phoneCountryCode'
>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(where: Prisma.UserWhereInput) {
    return this.prisma.user.findFirst({ where });
  }

  async updateProfile(userId: string, input: UpdateUserProfileInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: input,
    });
  }
}
