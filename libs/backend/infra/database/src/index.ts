export { BusinessException } from './business.exception';
export { DatabaseModule } from './database.module';
export { PrismaService } from './prisma.service';
export { SystemPrismaService } from './system-prisma.service';
export { TenantContextInterceptor } from './tenant-context.interceptor';
export { TenantContextStore, type TenantContext } from './tenant-context.store';

// Re-export the generated Prisma namespace + client so domain libs never
// import `@prisma/client` directly.
export { Prisma } from '@prisma/client';
