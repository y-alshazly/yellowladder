import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Minimal audit module — exposes the no-op `AuditService` and the
 * `@AuditLog()` decorator metadata key. Feature 01 uses the decorator for
 * documentation only; persistence is a TODO for the audit feature.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
