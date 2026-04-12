/**
 * Masks an email address for display on the OTP verify screen. Keeps the
 * first two characters of the local part, replaces the rest with `***`.
 *
 *   gywayne@gmail.com  →  gy***@gmail.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const prefix = local.slice(0, 2);
  return `${prefix}***@${domain}`;
}
