import { z } from 'zod';

export const editTeamMemberSchema = z.object({
  firstName: z.string().max(120, 'validation.nameTooLong').optional(),
  lastName: z.string().max(120, 'validation.nameTooLong').optional(),
  phoneCountryCode: z.string().optional(),
  phoneNationalNumber: z.string().optional(),
  email: z.string().email('validation.emailInvalid').optional().or(z.literal('')),
});

export type EditTeamMemberFormValues = z.infer<typeof editTeamMemberSchema>;
