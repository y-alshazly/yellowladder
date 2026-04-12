import { z } from 'zod';

export const otpVerifySchema = z.object({
  code: z
    .string({ error: 'validation.otpLength' })
    .length(6, { error: 'validation.otpLength' })
    .regex(/^\d{6}$/, { error: 'validation.otpLength' }),
});

export type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;
