import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SystemPrismaService } from './system-prisma.service';

/**
 * Global module exposing the two Prisma clients.
 *
 * `PrismaService` is the default — connects as `app_tenant`, RLS enforced,
 * wraps every operation in a tenant-scoped mini-transaction.
 *
 * `SystemPrismaService` connects as `app_system` (BYPASSRLS) and is ONLY for
 * `SUPER_ADMIN`-gated code paths.
 */
@Global()
@Module({
  providers: [PrismaService, SystemPrismaService],
  exports: [PrismaService, SystemPrismaService],
})
export class DatabaseModule {}
