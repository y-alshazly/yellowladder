import { z } from 'zod';

const UK_VAT_REGEX = /^GB[0-9]{9}(?:[0-9]{3})?$/i;

export const wizardBusinessProfileSchema = z
  .object({
    businessCategoryId: z
      .string({ error: 'validation.fieldRequired' })
      .min(1, { error: 'validation.fieldRequired' }),
    paymentMethodPreferenceId: z
      .string({ error: 'validation.fieldRequired' })
      .min(1, { error: 'validation.fieldRequired' }),
    annualTurnoverBandId: z
      .string({ error: 'validation.fieldRequired' })
      .min(1, { error: 'validation.fieldRequired' }),
    vatRegistered: z.boolean(),
    vatNumber: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.vatRegistered) return;
    if (!values.vatNumber || values.vatNumber.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['vatNumber'],
        message: 'validation.vatNumberRequired',
      });
      return;
    }
    if (!UK_VAT_REGEX.test(values.vatNumber)) {
      ctx.addIssue({
        code: 'custom',
        path: ['vatNumber'],
        message: 'validation.vatNumberInvalid',
      });
    }
  });

export type WizardBusinessProfileFormValues = z.infer<typeof wizardBusinessProfileSchema>;
