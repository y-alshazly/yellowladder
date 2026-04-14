import type { CreateMenuAddonOptionRequest } from '@yellowladder/shared-types';
import { z } from 'zod';

export const createAddonOptionSchema = z.object({
  nameEn: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { message: 'validation.fieldRequired' }),
  nameDe: z.string(),
  nameFr: z.string(),
  priceModifier: z.number().default(0),
  colorHex: z.string().nullable().optional(),
});

export type CreateAddonOptionFormValues = z.infer<typeof createAddonOptionSchema>;

/**
 * Maps validated form values to the API request shape.
 */
export function toCreateAddonOptionRequest(
  values: CreateAddonOptionFormValues,
): CreateMenuAddonOptionRequest {
  return {
    nameEn: values.nameEn,
    nameDe: values.nameDe || values.nameEn,
    nameFr: values.nameFr || values.nameEn,
    priceModifier: values.priceModifier,
    colorHex: values.colorHex ?? null,
  };
}
