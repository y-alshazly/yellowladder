import { z } from 'zod';

export const wizardCompaniesHouseSchema = z.object({
  query: z
    .string({ error: 'validation.fieldRequired' })
    .min(2, { error: 'validation.fieldRequired' }),
});

export type WizardCompaniesHouseFormValues = z.infer<typeof wizardCompaniesHouseSchema>;
