import { BusinessType } from '@yellowladder/shared-types';
import { z } from 'zod';
import { passwordSchema } from './../schemas/password.schema';

export const signupAccountSchema = z
  .object({
    email: z
      .string({ error: 'validation.emailRequired' })
      .min(1, { error: 'validation.emailRequired' })
      .email({ error: 'validation.emailInvalid' }),
    phoneCountryCode: z
      .string({ error: 'validation.countryRequired' })
      .min(2, { error: 'validation.countryRequired' }),
    phoneNationalNumber: z
      .string({ error: 'validation.phoneRequired' })
      .min(4, { error: 'validation.phoneInvalid' })
      .regex(/^[0-9]+$/, { error: 'validation.phoneInvalid' }),
    countryCode: z
      .string({ error: 'validation.countryRequired' })
      .min(2, { error: 'validation.countryRequired' }),
    businessType: z.enum([BusinessType.LimitedCompany, BusinessType.SelfEmployed], {
      error: 'validation.businessTypeRequired',
    }),
    password: passwordSchema,
    confirmPassword: z
      .string({ error: 'validation.passwordRequired' })
      .min(1, { error: 'validation.passwordRequired' }),
    termsAccepted: z.literal(true, { error: 'validation.termsRequired' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    error: 'validation.passwordsDoNotMatch',
  });

export type SignupAccountFormValues = z.infer<typeof signupAccountSchema>;
