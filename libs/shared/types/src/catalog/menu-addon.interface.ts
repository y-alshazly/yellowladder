export interface CreateMenuAddonRequest {
  menuItemId: string;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  isMultiSelect?: boolean;
  isRequired?: boolean;
  maxSelections?: number | null;
}

export interface UpdateMenuAddonRequest {
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
  isMultiSelect?: boolean;
  isRequired?: boolean;
  maxSelections?: number | null;
}

export interface GetMenuAddonResponse {
  id: string;
  companyId: string;
  menuItemId: string;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  isMultiSelect: boolean;
  isRequired: boolean;
  maxSelections: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  options: GetMenuAddonOptionResponse[];
}

export interface CreateMenuAddonOptionRequest {
  nameEn: string;
  nameDe: string;
  nameFr: string;
  priceModifier?: number;
  colorHex?: string | null;
}

export interface UpdateMenuAddonOptionRequest {
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
  priceModifier?: number;
  colorHex?: string | null;
  isActive?: boolean;
}

export interface GetMenuAddonOptionResponse {
  id: string;
  companyId: string;
  menuAddonId: string;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  priceModifier: number;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
