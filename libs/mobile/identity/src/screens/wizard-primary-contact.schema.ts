import { z } from 'zod';

export const wizardPrimaryContactSchema = z
  .object({
    source: z.enum(['PSC', 'MANUAL']),
    pscId: z.string().optional(),
    firstName: z
      .string({ error: 'validation.fieldRequired' })
      .min(1, { error: 'validation.fieldRequired' }),
    lastName: z
      .string({ error: 'validation.fieldRequired' })
      .min(1, { error: 'validation.fieldRequired' }),
    jobPosition: z
      .string({ error: 'validation.fieldRequired' })
      .min(1, { error: 'validation.fieldRequired' }),
    phoneE164: z.string().optional(),
    email: z.string().email({ error: 'validation.emailInvalid' }).optional().or(z.literal('')),
    authorisationConfirmed: z.literal(true, { error: 'validation.authorisationRequired' }),
  })
  .superRefine((values, ctx) => {
    if (values.source === 'PSC' && !values.pscId) {
      ctx.addIssue({
        code: 'custom',
        path: ['pscId'],
        message: 'validation.fieldRequired',
      });
    }
  });

export type WizardPrimaryContactFormValues = z.infer<typeof wizardPrimaryContactSchema>;
