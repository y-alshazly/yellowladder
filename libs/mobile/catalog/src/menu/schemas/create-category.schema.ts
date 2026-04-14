import type { CreateCategoryRequest } from '@yellowladder/shared-types';
import { z } from 'zod';

export const createCategorySchema = z.object({
  nameEn: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { message: 'validation.fieldRequired' }),
  nameDe: z.string(),
  nameFr: z.string(),
  iconName: z.string().nullable().optional(),
  emojiCode: z.string().nullable().optional(),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

/**
 * Maps validated form values to the API request shape.
 * For nameDe and nameFr, falls back to nameEn if not provided
 * (multi-language input deferred).
 */
export function toCreateCategoryRequest(values: CreateCategoryFormValues): CreateCategoryRequest {
  return {
    nameEn: values.nameEn,
    nameDe: values.nameDe || values.nameEn,
    nameFr: values.nameFr || values.nameEn,
    iconName: values.iconName ?? null,
    emojiCode: values.emojiCode ?? null,
  };
}
