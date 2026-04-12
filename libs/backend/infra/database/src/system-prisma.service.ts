import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { YellowladderConfigService } from '@yellowladder/backend-infra-config';

/**
 * Root-privileged Prisma client that connects as the `app_system` Postgres
 * role. `app_system` is `BYPASSRLS` — it can read and write every multi-tenant
 * table regardless of `app.current_company`.
 *
 * SECURITY: Never inject this service into a code path that does not first
 * call `AuthorizationService.requirePermission(user, <SUPER_ADMIN-gated permission>)`.
 * Any endpoint wired to this client must be reviewed by the architect.
 *
 * Feature 01 does NOT use this service — it exists to establish the contract.
 */
@Injectable()
export class SystemPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SystemPrismaService.name);

  constructor(config: YellowladderConfigService) {
    const url = config.databaseSystemUrl ?? config.databaseUrl;
    super({
      adapter: new PrismaPg(url),
      log: ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.warn(
      'SystemPrismaService connected — RLS is BYPASSED for this client. SUPER_ADMIN only.',
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
