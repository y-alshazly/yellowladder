import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'auditLog';

export interface AuditLogOptions {
  /** Plain verb for human-readable logs: Create | Read | Update | Delete | ... */
  action: string;
  /** Resource name, typically the Prisma model: User | Company | MenuItem | ... */
  resource: string;
  /** Capture before/after diff on update operations (interceptor responsibility). */
  captureDifferences?: boolean;
  /** Name of the `:id` route param to include in the log entry. */
  entityIdParam?: string;
}

/**
 * Declarative audit marker. Feature 01 ships the decorator only — the
 * interceptor that actually persists `LogEvent` rows is deferred to the
 * dedicated audit feature (owned by the architect in a later feature).
 *
 * The decorator is safe to apply now: consumers can annotate endpoints
 * without breakage, and the persistence layer picks up the metadata when
 * it lands.
 */
export const AuditLog = (options: AuditLogOptions): MethodDecorator =>
  SetMetadata(AUDIT_LOG_KEY, options);
