/**
 * Lightweight validator for the env schema. We do not pull in `joi` just for
 * Feature 01 — keep dependencies minimal and do the checks by hand. If more
 * config complexity appears, swap this for `joi` or `zod` later.
 */
export function validateYellowladderEnv(raw: Record<string, unknown>): Record<string, unknown> {
  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((k) => !raw[k] || String(raw[k]).length === 0);
  if (missing.length > 0 && raw['NODE_ENV'] === 'production') {
    throw new Error(
      `[yellowladder-config] Missing required env vars in production: ${missing.join(', ')}`,
    );
  }
  return raw;
}
