import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextStore } from './tenant-context.store';

/**
 * Populates the per-request `TenantContextStore` AsyncLocalStorage scope
 * with the authenticated user's `companyId` / `id`, so that `PrismaService`
 * can issue `SET LOCAL app.current_company = '<uuid>'` inside every
 * transactional query.
 *
 * This runs as a GLOBAL interceptor, which means it fires AFTER
 * `AuthenticationGuard` — so `request.user` is already populated by Passport
 * at the time we read it. A middleware cannot do this because NestJS
 * middleware runs before guards.
 *
 * For unauthenticated / pre-auth requests (register, login, OTP verify
 * before the access token has been minted), `request.user` is `undefined`
 * and we enter an empty context. Multi-tenant tables are unreachable in
 * that window because the `SET LOCAL` is skipped in `PrismaService`.
 */
interface RequestWithUser {
  user?: { id?: string; companyId?: string | null } | undefined;
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantContextInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only HTTP requests carry a `request.user` populated by Passport. For
    // WebSocket / RPC contexts we enter an empty tenant scope — sockets
    // authenticate via `WsJwtGuard` and set their own context downstream.
    if (context.getType() !== 'http') {
      return new Observable((subscriber) => {
        TenantContextStore.run({ companyId: null, userId: null }, () => {
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
      });
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const companyId = request.user?.companyId ?? null;
    const userId = request.user?.id ?? null;

    return new Observable((subscriber) => {
      TenantContextStore.run({ companyId, userId }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
