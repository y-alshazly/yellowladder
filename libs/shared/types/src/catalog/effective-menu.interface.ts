export interface GetEffectiveMenuResponse {
  shopId: string;
  categories: EffectiveCategory[];
}

export interface EffectiveCategory {
  id: string;
  overrideId: string | null;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  iconName: string | null;
  emojiCode: string | null;
  sortOrder: number;
  isActive: boolean;
  isNew: boolean;
  menuItems: EffectiveMenuItem[];
}

export interface EffectiveMenuItem {
  id: string;
  overrideId: string | null;
  categoryId: string;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  descriptionEn: string | null;
  descriptionDe: string | null;
  descriptionFr: string | null;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
  isDraft: boolean;
  sortOrder: number;
  addons: EffectiveMenuAddon[];
}

export interface EffectiveMenuAddon {
  id: string;
  overrideId: string | null;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  isMultiSelect: boolean;
  isRequired: boolean;
  maxSelections: number | null;
  sortOrder: number;
  options: EffectiveMenuAddonOption[];
}

export interface EffectiveMenuAddonOption {
  id: string;
  overrideId: string | null;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  priceModifier: number;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
}
