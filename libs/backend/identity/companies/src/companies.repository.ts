import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

export type CreateCompanyRepositoryInput = Omit<
  Prisma.CompanyUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface CreateCompanyPrimaryContactInput {
  source: 'PSC' | 'MANUAL';
  pscId?: string | null;
  firstName: string;
  lastName: string;
  jobPosition: string;
  phoneE164?: string | null;
  email?: string | null;
}

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(id: string) {
    return this.prisma.company.findFirst({ where: { id } });
  }

  async findOneByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.company.findFirst({ where: { idempotencyKey } });
  }

  async updateOne(id: string, data: Prisma.CompanyUncheckedUpdateInput) {
    return this.prisma.company.update({ where: { id }, data });
  }

  /**
   * Atomic Company creation + primary contact snapshot + user linkage.
   *
   * Runs inside `PrismaService.runAsNewTenant`, which opens a `$transaction`,
   * adopts `SET LOCAL ROLE app_tenant`, and sets
   * `app.current_company = '<companyId>'` BEFORE the first write. This is
   * critical because all three tables involved (`companies`,
   * `company_primary_contacts`, `users.company_id FK`) are touched under
   * RLS-protected policies whose `WITH CHECK` clauses compare against
   * `current_setting('app.current_company', true)::uuid`.
   *
   * The caller supplies `companyId` (a client-generated UUID — we reuse the
   * idempotency key for this). Passing it ahead of the `tx.company.create`
   * is what lets the `WITH CHECK` clause `id = current_setting(...)`
   * succeed on insert.
   */
  async createCompanyWithContactAndLinkUser(
    companyId: string,
    company: CreateCompanyRepositoryInput,
    primaryContact: CreateCompanyPrimaryContactInput,
    userId: string,
  ) {
    return this.prisma.runAsNewTenant(companyId, async (tx) => {
      const created = await tx.company.create({
        data: { ...company, id: companyId },
      });
      await tx.companyPrimaryContact.create({
        data: {
          companyId: created.id,
          source: primaryContact.source,
          pscId: primaryContact.pscId ?? null,
          firstName: primaryContact.firstName,
          lastName: primaryContact.lastName,
          jobPosition: primaryContact.jobPosition,
          phoneE164: primaryContact.phoneE164 ?? null,
          email: primaryContact.email ?? null,
        },
      });
      // `users` is platform-global (no company_id column, no RLS). The
      // update works regardless of the tenant context — but doing it inside
      // the same transaction makes the link atomic with the company insert.
      await tx.user.update({
        where: { id: userId },
        data: {
          companyId: created.id,
          onboardingPhase: 'PHASE_C_COMPLETED',
        },
      });
      return created;
    });
  }
}
