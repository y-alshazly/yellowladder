export interface ShopAddress {
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postcode: string;
  countryCode: string;
}

export interface CreateShopRequest {
  name: string;
  address: ShopAddress;
  phone?: string | null;
  hours?: Record<string, unknown> | null;
}

export interface UpdateShopRequest {
  name?: string;
  address?: ShopAddress;
  phone?: string | null;
  hours?: Record<string, unknown> | null;
  logoUrl?: string | null;
}

export interface ReorderShopsRequest {
  /** Ordered list of shop IDs — position in the array becomes the sort_order. */
  shopIds: string[];
}

export interface GetShopResponse {
  id: string;
  companyId: string;
  name: string;
  logoUrl: string | null;
  address: ShopAddress;
  phone: string | null;
  hours: Record<string, unknown> | null;
  isArchived: boolean;
  sortOrder: number;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}
