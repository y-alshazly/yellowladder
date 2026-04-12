import { Injectable, Logger } from '@nestjs/common';
import type { AuditLogOptions } from './audit-log.decorator';

/**
 * No-op audit service stub. Feature 01 wires the decorator + module but
 * does NOT persist anything — the full `LogEvent` persistence layer is
 * deferred to a dedicated audit feature (see TODO(feature-audit)).
 *
 * Call sites can inject and call `record()` today; every invocation is
 * logged via Nest's logger so nothing is silently dropped, but no database
 * row is written.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  record(
    options: AuditLogOptions,
    context: { userId?: string | null; companyId?: string | null; metadata?: unknown },
  ): void {
    this.logger.log(
      `[AUDIT stub] ${options.action} ${options.resource} user=${context.userId ?? 'anonymous'} company=${context.companyId ?? 'none'}`,
    );
  }
}
