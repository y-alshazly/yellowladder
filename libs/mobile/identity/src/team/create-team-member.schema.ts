import { UserRole } from '@yellowladder/shared-types';
import { z } from 'zod';

export const createTeamMemberSchema = z.object({
  email: z.string().min(1, 'validation.emailRequired').email('validation.emailInvalid'),
  firstName: z.string().min(1, 'validation.fieldRequired').max(120, 'validation.nameTooLong'),
  lastName: z.string().min(1, 'validation.fieldRequired').max(120, 'validation.nameTooLong'),
  phoneCountryCode: z.string().min(1, 'validation.countryRequired'),
  phoneNationalNumber: z.string().min(1, 'validation.phoneRequired'),
  countryCode: z.string().min(1, 'validation.countryRequired'),
  role: z.enum([UserRole.CompanyAdmin, UserRole.ShopManager, UserRole.Employee], {
    errorMap: () => ({ message: 'validation.fieldRequired' }),
  }),
  shopIds: z.array(z.string()),
  password: z.string().min(8, 'validation.passwordTooShort'),
});

export type CreateTeamMemberFormValues = z.infer<typeof createTeamMemberSchema>;
