export interface UpdateShopCategoryRequest {
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
}

export interface GetShopCategoryResponse {
  id: string;
  companyId: string;
  shopId: string;
  categoryId: string;
  nameEn: string | null;
  nameDe: string | null;
  nameFr: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateShopMenuItemRequest {
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  basePrice?: number | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
}

export interface GetShopMenuItemResponse {
  id: string;
  companyId: string;
  shopId: string;
  menuItemId: string;
  nameEn: string | null;
  nameDe: string | null;
  nameFr: string | null;
  basePrice: number | null;
  isActive: boolean | null;
  sortOrder: number | null;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateShopMenuAddonRequest {
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  isMultiSelect?: boolean | null;
  isRequired?: boolean | null;
  maxSelections?: number | null;
  sortOrder?: number | null;
}

export interface GetShopMenuAddonResponse {
  id: string;
  companyId: string;
  shopId: string;
  menuAddonId: string;
  nameEn: string | null;
  nameDe: string | null;
  nameFr: string | null;
  isMultiSelect: boolean | null;
  isRequired: boolean | null;
  maxSelections: number | null;
  sortOrder: number | null;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateShopMenuAddonOptionRequest {
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  priceModifier?: number | null;
  colorHex?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
}

export interface GetShopMenuAddonOptionResponse {
  id: string;
  companyId: string;
  shopId: string;
  menuAddonOptionId: string;
  nameEn: string | null;
  nameDe: string | null;
  nameFr: string | null;
  priceModifier: number | null;
  colorHex: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}
