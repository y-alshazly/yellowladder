import { z } from 'zod';

/**
 * Strong password policy matching architect §1.3 for STATE_CREATE_ACCOUNT.
 * Keep in sync with the backend `authentication.constants.ts`.
 */
export const passwordSchema = z
  .string({ error: 'validation.passwordRequired' })
  .min(12, { error: 'validation.passwordTooShort' })
  .regex(/[a-z]/, { error: 'validation.passwordLowercase' })
  .regex(/[A-Z]/, { error: 'validation.passwordUppercase' })
  .regex(/\d/, { error: 'validation.passwordDigit' })
  .regex(/[^A-Za-z0-9]/, { error: 'validation.passwordSymbol' });
