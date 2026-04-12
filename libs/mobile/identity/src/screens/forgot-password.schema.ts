import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: 'validation.emailRequired' })
    .min(1, { error: 'validation.emailRequired' })
    .email({ error: 'validation.emailInvalid' }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
