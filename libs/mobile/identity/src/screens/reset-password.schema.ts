import { z } from 'zod';
import { passwordSchema } from './../schemas/password.schema';

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmNewPassword: z
      .string({ error: 'validation.passwordRequired' })
      .min(1, { error: 'validation.passwordRequired' }),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    path: ['confirmNewPassword'],
    error: 'validation.passwordsDoNotMatch',
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
