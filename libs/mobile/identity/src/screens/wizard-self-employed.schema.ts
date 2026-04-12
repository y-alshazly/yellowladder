import { z } from 'zod';

const MAX = 120;
const MIN_AGE_YEARS = 18;

function isAtLeast18YearsOld(isoDate: string): boolean {
  const birth = new Date(isoDate);
  if (Number.isNaN(birth.getTime())) return false;
  const now = new Date();
  const yearsDiff = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const dayDiff = now.getDate() - birth.getDate();
  const fullYears = yearsDiff - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);
  return fullYears >= MIN_AGE_YEARS;
}

export const wizardSelfEmployedSchema = z.object({
  firstName: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' })
    .max(MAX, { error: 'validation.nameTooLong' }),
  lastName: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' })
    .max(MAX, { error: 'validation.nameTooLong' }),
  jobPosition: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' })
    .max(MAX, { error: 'validation.nameTooLong' }),
  dateOfBirth: z
    .string({ error: 'validation.dateInvalid' })
    .min(1, { error: 'validation.dateInvalid' })
    .refine(isAtLeast18YearsOld, { error: 'wizard.selfEmployed.ageRestriction' }),
  legalBusinessName: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' })
    .max(MAX, { error: 'validation.nameTooLong' }),
  tradingName: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' })
    .max(MAX, { error: 'validation.nameTooLong' }),
  registeredAddressLine1: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' }),
  registeredAddressCity: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' }),
  registeredAddressPostalCode: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' }),
  registeredAddressCountryCode: z
    .string({ error: 'validation.countryRequired' })
    .min(2, { error: 'validation.countryRequired' }),
  storeIsSameAddress: z.boolean(),
  authorisationConfirmed: z.literal(true, { error: 'validation.authorisationRequired' }),
});

export type WizardSelfEmployedFormValues = z.infer<typeof wizardSelfEmployedSchema>;
