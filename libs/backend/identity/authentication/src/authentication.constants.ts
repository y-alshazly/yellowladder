/**
 * Tuneable authentication limits. Collected in one place so ops can find
 * them easily and so the service is free of magic numbers.
 */

/** bcrypt cost factor. Per security constraints, must be >= 12. */
export const BCRYPT_COST = 12;

/** OTP code length (digits). */
export const OTP_CODE_LENGTH = 6;

/** OTP TTL in milliseconds (5 minutes). */
export const OTP_TTL_MS = 5 * 60 * 1000;

/** Maximum verification attempts per OTP code. */
export const OTP_MAX_ATTEMPTS = 5;

/** Maximum OTP requests per email per rolling window. */
export const OTP_MAX_REQUESTS_PER_WINDOW = 3;

/** Window used to count OTP requests (15 minutes). */
export const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;

/** Password reset token TTL in milliseconds (1 hour). */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/** Maximum password reset requests per email per rolling window. */
export const PASSWORD_RESET_MAX_REQUESTS_PER_WINDOW = 3;

/** Length of the raw (pre-hash) password reset token, in bytes. */
export const PASSWORD_RESET_TOKEN_BYTES = 32;

/** Length of the raw CSRF token (riding in cookie / header), in bytes. */
export const CSRF_TOKEN_BYTES = 32;

/** Password minimum length per architect state machine. */
export const PASSWORD_MIN_LENGTH = 12;
