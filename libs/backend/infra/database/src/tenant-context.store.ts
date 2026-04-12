import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request tenant context. Populated by `TenantContextMiddleware` at the
 * edge of each HTTP request and consumed by `PrismaService` to set
 * `SET LOCAL app.current_company` inside a mini-transaction.
 *
 * Use `AsyncLocalStorage` so context is naturally scoped to the request's
 * async task tree with no leakage across concurrent connections.
 */
export interface TenantContext {
  companyId: string | null;
  userId: string | null;
}

const storage = new AsyncLocalStorage<TenantContext>();

export const TenantContextStore = {
  run<T>(context: TenantContext, callback: () => T): T {
    return storage.run(context, callback);
  },

  get(): TenantContext | undefined {
    return storage.getStore();
  },

  getCompanyId(): string | null {
    return storage.getStore()?.companyId ?? null;
  },

  getUserId(): string | null {
    return storage.getStore()?.userId ?? null;
  },
};
