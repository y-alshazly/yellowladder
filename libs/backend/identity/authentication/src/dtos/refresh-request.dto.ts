import type { RefreshRequest } from '@yellowladder/shared-types';

/**
 * Empty body — the refresh token rides in the HttpOnly cookie (web) or
 * Authorization header (mobile); the CSRF token rides in `X-CSRF-Token`.
 *
 * The controller method does not consume a body param for this endpoint —
 * we only keep the DTO declaration so the shape is referenced from
 * shared/types, anchoring the API contract.
 */
export class RefreshRequestDto {
  private static readonly _shape?: RefreshRequest;
}
