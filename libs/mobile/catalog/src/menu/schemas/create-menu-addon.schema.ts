import type { CreateMenuAddonRequest } from '@yellowladder/shared-types';
import { z } from 'zod';

export const createMenuAddonSchema = z.object({
  nameEn: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { message: 'validation.fieldRequired' }),
  nameDe: z.string(),
  nameFr: z.string(),
  menuItemId: z
    .string({ error: 'validation.fieldRequired' })
    .uuid({ message: 'validation.fieldRequired' }),
});

export type CreateMenuAddonFormValues = z.infer<typeof createMenuAddonSchema>;

/**
 * Maps validated form values to the API request shape.
 */
export function toCreateMenuAddonRequest(
  values: CreateMenuAddonFormValues,
): CreateMenuAddonRequest {
  return {
    menuItemId: values.menuItemId,
    nameEn: values.nameEn,
    nameDe: values.nameDe || values.nameEn,
    nameFr: values.nameFr || values.nameEn,
  };
}
