export interface CreateMenuItemRequest {
  categoryId: string;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  descriptionEn?: string | null;
  descriptionDe?: string | null;
  descriptionFr?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  isDraft?: boolean;
}

export interface UpdateMenuItemRequest {
  categoryId?: string;
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
  descriptionEn?: string | null;
  descriptionDe?: string | null;
  descriptionFr?: string | null;
  basePrice?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  isDraft?: boolean;
}

export interface GetMenuItemResponse {
  id: string;
  companyId: string;
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
  createdAt: string;
  updatedAt: string;
}
