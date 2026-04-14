import type { CreateMenuItemRequest } from '@yellowladder/shared-types';
import { z } from 'zod';

export const createMenuItemSchema = z.object({
  nameEn: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { message: 'validation.fieldRequired' }),
  nameDe: z.string(),
  nameFr: z.string(),
  categoryId: z
    .string({ error: 'validation.fieldRequired' })
    .uuid({ message: 'validation.fieldRequired' }),
  basePrice: z.number({ error: 'validation.fieldRequired' }).min(0, {
    message: 'validation.fieldRequired',
  }),
});

export type CreateMenuItemFormValues = z.infer<typeof createMenuItemSchema>;

/**
 * Maps validated form values to the API request shape.
 * For nameDe and nameFr, falls back to nameEn if not provided
 * (multi-language input deferred).
 */
export function toCreateMenuItemRequest(values: CreateMenuItemFormValues): CreateMenuItemRequest {
  return {
    categoryId: values.categoryId,
    nameEn: values.nameEn,
    nameDe: values.nameDe || values.nameEn,
    nameFr: values.nameFr || values.nameEn,
    basePrice: values.basePrice,
  };
}
