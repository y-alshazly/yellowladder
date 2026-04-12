import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { TenantContextStore } from './tenant-context.store';

/**
 * Prisma model operation names that are wrapped in a tenant-scoped
 * mini-transaction. We intercept these on the generated client via a Proxy so
 * every query runs with `SET LOCAL app.current_company = '<uuid>'` applied.
 *
 * RLS policies on multi-tenant tables reference
 * `current_setting('app.current_company', true)::uuid` and silently filter
 * rows that do not match.
 *
 * When `TenantContextStore.getCompanyId()` is null (Phase A/B — the user has
 * registered but has not created a Company yet), the query still runs inside
 * a transaction but no session variable is set. Multi-tenant tables reject
 * reads/writes from that connection because the RLS policy returns NULL.
 * Only platform-global tables (users, otp_records, etc.) are reachable in
 * that window.
 */
const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'upsert',
  'delete',
  'deleteMany',
]);

const READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const TRANSACTIONAL_OPERATIONS = new Set([...WRITE_OPERATIONS, ...READ_OPERATIONS]);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL env var must be set before PrismaService is instantiated');
    }
    super({
      adapter: new PrismaPg(connectionString),
      log:
        process.env['NODE_ENV'] === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });
    return this.withTenantProxy();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Wraps every `prisma.<model>.<operation>` call in a mini-transaction
   * with `SET LOCAL app.current_company` pulled from the AsyncLocalStorage
   * tenant context. Returns a Proxy that looks identical to the raw client.
   */
  private withTenantProxy(): this {
    const runInTx = (action: () => unknown): Promise<unknown> =>
      this.runInTenantTransaction(action);
    return new Proxy(this, {
      get(target, property: string | symbol, receiver): unknown {
        const value = Reflect.get(target, property, receiver);
        // Top-level PrismaClient methods ($transaction, $connect, ...) pass through.
        if (typeof property !== 'string' || property.startsWith('$') || property.startsWith('_')) {
          return value;
        }
        // Internal Nest lifecycle methods pass through.
        if (property === 'onModuleInit' || property === 'onModuleDestroy') {
          return value;
        }
        // Model delegates are objects. Wrap their operations.
        if (value && typeof value === 'object') {
          return new Proxy(value as Record<string, unknown>, {
            get(modelTarget, operation: string | symbol): unknown {
              const operationValue = Reflect.get(modelTarget, operation);
              if (
                typeof operation === 'string' &&
                typeof operationValue === 'function' &&
                TRANSACTIONAL_OPERATIONS.has(operation)
              ) {
                return (...args: unknown[]) =>
                  runInTx(() =>
                    (operationValue as (...a: unknown[]) => unknown).apply(modelTarget, args),
                  );
              }
              return operationValue;
            },
          });
        }
        return value;
      },
    }) as this;
  }

  private async runInTenantTransaction<T>(action: () => unknown): Promise<T> {
    const companyId = TenantContextStore.getCompanyId();
    return (await this.$transaction(async (tx) => {
      // Adopt the tenant-scoped Postgres role BEFORE doing anything else.
      // The login role this connection uses is a member of `app_tenant`
      // (see migration `0000_init_roles`), so `SET LOCAL ROLE app_tenant`
      // is permitted and the role is reset automatically at transaction
      // commit/rollback. This is required because all RLS policies on
      // multi-tenant tables are scoped `TO app_tenant`.
      //
      // `$executeRawUnsafe` is appropriate here because the statement
      // contains ZERO user input — `app_tenant` is a compile-time constant
      // role name.
      await tx.$executeRawUnsafe(`SET LOCAL ROLE app_tenant`);

      if (companyId) {
        // Parameterised — companyId is always a UUID pulled from our own JWT,
        // never client-attacker input, but we still use $executeRaw (tagged
        // template) rather than $executeRawUnsafe. Prisma escapes UUIDs.
        await tx.$executeRaw`SELECT set_config('app.current_company', ${companyId}, true)`;
        this.logger.debug(`Tenant transaction opened for company ${companyId}`);
      } else {
        this.logger.debug('Tenant transaction opened without company context (Phase A/B)');
      }
      return action();
    })) as T;
  }

  /**
   * Public helper for operations that need to create a brand-new tenant row
   * (e.g. `POST /companies` at the end of Phase C). The caller supplies the
   * new company id (must be a UUID). The transaction runs as `app_tenant`
   * with `app.current_company` set to the new id, so the RLS `WITH CHECK`
   * clause `id = current_setting('app.current_company')::uuid` matches and
   * the insert succeeds. The action receives the same `tx` Prisma client the
   * internal transactional wrapper uses.
   */
  async runAsNewTenant<T>(
    newCompanyId: string,
    action: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE app_tenant`);
      await tx.$executeRaw`SELECT set_config('app.current_company', ${newCompanyId}, true)`;
      this.logger.debug(`Tenant transaction opened for new company ${newCompanyId}`);
      return action(tx);
    });
  }
}
