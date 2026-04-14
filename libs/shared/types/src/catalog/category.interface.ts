export interface CreateCategoryRequest {
  nameEn: string;
  nameDe: string;
  nameFr: string;
  iconName?: string | null;
  emojiCode?: string | null;
}

export interface UpdateCategoryRequest {
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
  iconName?: string | null;
  emojiCode?: string | null;
  isActive?: boolean;
}

export interface ReorderCategoriesRequest {
  categoryIds: string[];
}

export interface GetCategoryResponse {
  id: string;
  companyId: string;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  iconName: string | null;
  emojiCode: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
