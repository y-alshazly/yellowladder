import { z } from 'zod';
import { passwordSchema } from './../schemas/password.schema';

export const profileEditSchema = z.object({
  firstName: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' })
    .max(120, { error: 'validation.nameTooLong' }),
  lastName: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' })
    .max(120, { error: 'validation.nameTooLong' }),
  phoneE164: z
    .string({ error: 'validation.phoneRequired' })
    .min(4, { error: 'validation.phoneInvalid' }),
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: 'validation.passwordRequired' })
      .min(1, { error: 'validation.passwordRequired' }),
    newPassword: passwordSchema,
    confirmNewPassword: z
      .string({ error: 'validation.passwordRequired' })
      .min(1, { error: 'validation.passwordRequired' }),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    path: ['confirmNewPassword'],
    error: 'validation.passwordsDoNotMatch',
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
