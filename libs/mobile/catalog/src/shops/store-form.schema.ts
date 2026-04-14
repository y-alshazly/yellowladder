import type {
  CreateShopRequest,
  GetShopResponse,
  UpdateShopRequest,
} from '@yellowladder/shared-types';
import { z } from 'zod';

export const storeFormSchema = z.object({
  name: z.string({ error: 'stores.nameRequired' }).min(1, { error: 'stores.nameRequired' }),
  city: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' }),
  addressLine1: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' }),
  postcode: z
    .string({ error: 'validation.fieldRequired' })
    .min(1, { error: 'validation.fieldRequired' }),
  addressLine2: z.string().optional(),
  region: z.string().optional(),
});

export type StoreFormValues = z.infer<typeof storeFormSchema>;

export const emptyStoreFormValues: StoreFormValues = {
  name: '',
  city: '',
  addressLine1: '',
  postcode: '',
  addressLine2: '',
  region: '',
};

export function shopToStoreFormValues(shop: GetShopResponse): StoreFormValues {
  return {
    name: shop.name,
    city: shop.address.city,
    addressLine1: shop.address.line1,
    postcode: shop.address.postcode,
    addressLine2: shop.address.line2 ?? '',
    region: shop.address.region ?? '',
  };
}

export function toCreateShopRequest(values: StoreFormValues): CreateShopRequest {
  return {
    name: values.name,
    address: {
      line1: values.addressLine1,
      line2: values.addressLine2 ?? null,
      city: values.city,
      region: values.region ?? null,
      postcode: values.postcode,
      countryCode: 'GB',
    },
  };
}

export function toUpdateShopRequest(values: StoreFormValues): UpdateShopRequest {
  return {
    name: values.name,
    address: {
      line1: values.addressLine1,
      line2: values.addressLine2 ?? null,
      city: values.city,
      region: values.region ?? null,
      postcode: values.postcode,
      countryCode: 'GB',
    },
  };
}
