import type { LoginRequest } from '@yellowladder/shared-types';
import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z
    .string({ error: 'validation.emailRequired' })
    .min(1, { error: 'validation.emailRequired' })
    .email({ error: 'validation.emailInvalid' }),
  password: z
    .string({ error: 'validation.passwordRequired' })
    .min(1, { error: 'validation.passwordRequired' }),
});

export type LoginFormValues = z.infer<typeof loginRequestSchema>;

// Structural compatibility with the shared-types contract. Compilation fails
// if the Zod schema drifts from `LoginRequest`.
const _typeCheck: LoginFormValues = {} as unknown as Pick<LoginRequest, 'email' | 'password'>;
void _typeCheck;
