import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  AdminResetPasswordResponse,
  AnnualTurnoverOption,
  AssignTeamMemberShopsRequest,
  AuthenticatedUser,
  BusinessCategoryOption,
  BusinessTypeOption,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CompaniesHouseLookupResponse,
  CompaniesHouseSearchRequest,
  CompaniesHouseSearchResponse,
  CreateCategoryRequest,
  CreateCompanyRequest,
  CreateCompanyResponse,
  CreateMenuAddonOptionRequest,
  CreateMenuAddonRequest,
  CreateMenuItemRequest,
  CreateShopRequest,
  CreateTeamMemberRequest,
  DeleteTeamMemberResponse,
  GetCategoryResponse,
  GetEffectiveMenuResponse,
  GetMenuAddonResponse,
  GetMenuItemResponse,
  GetShopCategoryResponse,
  GetShopMenuItemResponse,
  GetShopResponse,
  GetTeamMemberResponse,
  LoginRequest,
  LoginResponse,
  OtpRequestRequest,
  OtpRequestResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  PasswordResetCompleteRequest,
  PasswordResetCompleteResponse,
  PasswordResetInitiateRequest,
  PasswordResetInitiateResponse,
  PaymentMethodPreferenceOption,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  RegisterRequest,
  RegisterResponse,
  ReorderCategoriesRequest,
  ReorderShopsRequest,
  UpdateCategoryRequest,
  UpdateMenuAddonOptionRequest,
  UpdateMenuAddonRequest,
  UpdateMenuItemRequest,
  UpdateShopCategoryRequest,
  UpdateShopMenuItemRequest,
  UpdateShopRequest,
  UpdateTeamMemberRequest,
  UpdateTeamMemberRoleRequest,
  UploadProfilePhotoResponse,
} from '@yellowladder/shared-types';
import { yellowladderBaseQuery } from './base-query/base-query';

/**
 * Paginated response wrapper returned by list endpoints.
 */
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    take: number;
    skip: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Single RTK Query API slice for every Yellow Ladder endpoint consumed by
 * the mobile (and eventually web) client. All endpoints live here because
 * RTK Query discourages fragmenting endpoints across multiple `createApi`
 * calls — tag invalidation only works within a single slice.
 *
 * Endpoints are grouped by domain via comment headers for readability.
 */
export const yellowladderApi = createApi({
  reducerPath: 'yellowladderApi',
  baseQuery: yellowladderBaseQuery,
  tagTypes: [
    'CurrentUser',
    'BusinessType',
    'BusinessCategory',
    'AnnualTurnoverBand',
    'PaymentMethod',
    'Company',
    'Shop',
    'Category',
    'MenuItem',
    'MenuAddon',
    'ShopCategory',
    'ShopMenuItem',
    'TeamMember',
    'EffectiveMenu',
  ],
  endpoints: (builder) => ({
    // ---------------- Authentication ----------------
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['CurrentUser'],
    }),
    logout: builder.mutation<{ success: true }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    requestOtp: builder.mutation<OtpRequestResponse, OtpRequestRequest>({
      query: (body) => ({ url: '/auth/otp/request', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation<OtpVerifyResponse, OtpVerifyRequest>({
      query: (body) => ({ url: '/auth/otp/verify', method: 'POST', body }),
      invalidatesTags: ['CurrentUser'],
    }),
    initiatePasswordReset: builder.mutation<
      PasswordResetInitiateResponse,
      PasswordResetInitiateRequest
    >({
      query: (body) => ({ url: '/auth/password-reset/initiate', method: 'POST', body }),
    }),
    completePasswordReset: builder.mutation<
      PasswordResetCompleteResponse,
      PasswordResetCompleteRequest
    >({
      query: (body) => ({ url: '/auth/password-reset/complete', method: 'POST', body }),
    }),

    // ---------------- Users ----------------
    getCurrentUser: builder.query<AuthenticatedUser, void>({
      query: () => ({ url: '/users/me', method: 'GET' }),
      providesTags: ['CurrentUser'],
    }),
    updateCurrentUser: builder.mutation<ProfileUpdateResponse, ProfileUpdateRequest>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['CurrentUser'],
    }),
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({ url: '/users/me/change-password', method: 'POST', body }),
    }),
    /**
     * Photo upload — backend currently returns 501. The UI stub surfaces a
     * "coming soon" state until `libs/backend/infra/storage` lands.
     * TODO(feature-storage).
     */
    uploadProfilePhoto: builder.mutation<UploadProfilePhotoResponse, FormData>({
      query: (body) => ({
        url: '/users/me/photo',
        method: 'POST',
        body,
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    // ---------------- Companies ----------------
    createCompany: builder.mutation<CreateCompanyResponse, CreateCompanyRequest>({
      query: (body) => ({
        url: '/companies',
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': body.idempotencyKey },
      }),
      invalidatesTags: ['CurrentUser', 'Company'],
    }),

    // ---------------- Companies House ----------------
    searchCompaniesHouse: builder.query<CompaniesHouseSearchResponse, CompaniesHouseSearchRequest>({
      query: ({ query, page, pageSize }) => ({
        url: '/companies-house/search',
        method: 'GET',
        params: { query, page, pageSize },
      }),
    }),
    lookupCompaniesHouse: builder.query<CompaniesHouseLookupResponse, string>({
      query: (registrationNumber) => ({
        url: `/companies-house/${registrationNumber}`,
        method: 'GET',
      }),
    }),

    // ---------------- Config enums ----------------
    getBusinessTypes: builder.query<readonly BusinessTypeOption[], void>({
      query: () => ({ url: '/business-types', method: 'GET' }),
      providesTags: ['BusinessType'],
    }),
    getBusinessCategories: builder.query<readonly BusinessCategoryOption[], void>({
      query: () => ({ url: '/business-categories', method: 'GET' }),
      providesTags: ['BusinessCategory'],
    }),
    getAnnualTurnoverBands: builder.query<readonly AnnualTurnoverOption[], void>({
      query: () => ({ url: '/annual-turnover-bands', method: 'GET' }),
      providesTags: ['AnnualTurnoverBand'],
    }),
    getPaymentMethods: builder.query<readonly PaymentMethodPreferenceOption[], void>({
      query: () => ({ url: '/payment-methods', method: 'GET' }),
      providesTags: ['PaymentMethod'],
    }),

    // ---------------- Shops (Catalog) ----------------
    getShops: builder.query<
      PaginatedResponse<GetShopResponse>,
      { page?: number; limit?: number; includeArchived?: boolean }
    >({
      query: (params) => ({ url: '/shops', method: 'GET', params }),
      providesTags: ['Shop'],
    }),
    getShopById: builder.query<GetShopResponse, string>({
      query: (id) => ({ url: `/shops/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Shop', id }],
    }),
    createShop: builder.mutation<GetShopResponse, CreateShopRequest>({
      query: (body) => ({ url: '/shops', method: 'POST', body }),
      invalidatesTags: ['Shop'],
    }),
    updateShop: builder.mutation<GetShopResponse, { id: string; body: UpdateShopRequest }>({
      query: ({ id, body }) => ({ url: `/shops/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Shop'],
    }),
    archiveShop: builder.mutation<GetShopResponse, string>({
      query: (id) => ({ url: `/shops/${id}/archive`, method: 'POST' }),
      invalidatesTags: ['Shop'],
    }),
    unarchiveShop: builder.mutation<GetShopResponse, string>({
      query: (id) => ({ url: `/shops/${id}/unarchive`, method: 'POST' }),
      invalidatesTags: ['Shop'],
    }),
    reorderShops: builder.mutation<void, ReorderShopsRequest>({
      query: (body) => ({ url: '/shops/reorder', method: 'PUT', body }),
      invalidatesTags: ['Shop'],
    }),

    // ---------------- Categories (Catalog) ----------------
    getCategories: builder.query<
      PaginatedResponse<GetCategoryResponse>,
      { page?: number; limit?: number }
    >({
      query: (params) => ({ url: '/categories', method: 'GET', params }),
      providesTags: ['Category'],
    }),
    getCategoryById: builder.query<GetCategoryResponse, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),
    createCategory: builder.mutation<GetCategoryResponse, CreateCategoryRequest>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category', 'EffectiveMenu'],
    }),
    updateCategory: builder.mutation<
      GetCategoryResponse,
      { id: string; body: UpdateCategoryRequest }
    >({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Category', 'EffectiveMenu'],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category', 'EffectiveMenu'],
    }),
    reorderCategories: builder.mutation<void, ReorderCategoriesRequest>({
      query: (body) => ({ url: '/categories/reorder', method: 'PUT', body }),
      invalidatesTags: ['Category', 'EffectiveMenu'],
    }),

    // ---------------- Menu Items (Catalog) ----------------
    getMenuItems: builder.query<
      PaginatedResponse<GetMenuItemResponse>,
      { page?: number; limit?: number; categoryId?: string }
    >({
      query: (params) => ({ url: '/menu-items', method: 'GET', params }),
      providesTags: ['MenuItem'],
    }),
    getMenuItemById: builder.query<GetMenuItemResponse, string>({
      query: (id) => ({ url: `/menu-items/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'MenuItem', id }],
    }),
    createMenuItem: builder.mutation<GetMenuItemResponse, CreateMenuItemRequest>({
      query: (body) => ({ url: '/menu-items', method: 'POST', body }),
      invalidatesTags: ['MenuItem', 'EffectiveMenu'],
    }),
    updateMenuItem: builder.mutation<
      GetMenuItemResponse,
      { id: string; body: UpdateMenuItemRequest }
    >({
      query: ({ id, body }) => ({ url: `/menu-items/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['MenuItem', 'EffectiveMenu'],
    }),
    deleteMenuItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/menu-items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MenuItem', 'EffectiveMenu'],
    }),

    // ---------------- Menu Addons (Catalog) ----------------
    getMenuAddons: builder.query<
      PaginatedResponse<GetMenuAddonResponse>,
      { page?: number; limit?: number; menuItemId?: string }
    >({
      query: (params) => ({ url: '/menu-addons', method: 'GET', params }),
      providesTags: ['MenuAddon'],
    }),
    getMenuAddonById: builder.query<GetMenuAddonResponse, string>({
      query: (id) => ({ url: `/menu-addons/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'MenuAddon', id }],
    }),
    createMenuAddon: builder.mutation<GetMenuAddonResponse, CreateMenuAddonRequest>({
      query: (body) => ({ url: '/menu-addons', method: 'POST', body }),
      invalidatesTags: ['MenuAddon', 'EffectiveMenu'],
    }),
    updateMenuAddon: builder.mutation<
      GetMenuAddonResponse,
      { id: string; body: UpdateMenuAddonRequest }
    >({
      query: ({ id, body }) => ({ url: `/menu-addons/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['MenuAddon', 'EffectiveMenu'],
    }),
    deleteMenuAddon: builder.mutation<void, string>({
      query: (id) => ({ url: `/menu-addons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MenuAddon', 'EffectiveMenu'],
    }),
    createMenuAddonOption: builder.mutation<
      GetMenuAddonResponse,
      { menuAddonId: string; body: CreateMenuAddonOptionRequest }
    >({
      query: ({ menuAddonId, body }) => ({
        url: `/menu-addons/${menuAddonId}/options`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MenuAddon', 'EffectiveMenu'],
    }),
    updateMenuAddonOption: builder.mutation<
      void,
      { optionId: string; body: UpdateMenuAddonOptionRequest }
    >({
      query: ({ optionId, body }) => ({
        url: `/menu-addons/options/${optionId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['MenuAddon', 'EffectiveMenu'],
    }),
    deleteMenuAddonOption: builder.mutation<void, string>({
      query: (optionId) => ({ url: `/menu-addons/options/${optionId}`, method: 'DELETE' }),
      invalidatesTags: ['MenuAddon', 'EffectiveMenu'],
    }),

    // ---------------- Effective Menu (merged shop view) ----------------
    getEffectiveMenu: builder.query<GetEffectiveMenuResponse, string>({
      query: (shopId) => ({ url: `/shops/${shopId}/menu`, method: 'GET' }),
      providesTags: (_result, _error, shopId) => [{ type: 'EffectiveMenu', id: shopId }],
    }),

    // ---------------- Shop Overrides (Catalog) ----------------
    getShopCategories: builder.query<GetShopCategoryResponse[], string>({
      query: (shopId) => ({ url: `/shops/${shopId}/categories`, method: 'GET' }),
      providesTags: ['ShopCategory'],
    }),
    upsertShopCategory: builder.mutation<
      GetShopCategoryResponse,
      { shopId: string; categoryId: string; body: UpdateShopCategoryRequest }
    >({
      query: ({ shopId, categoryId, body }) => ({
        url: `/shops/${shopId}/categories/${categoryId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ShopCategory', 'EffectiveMenu'],
    }),
    deleteShopCategory: builder.mutation<void, { shopId: string; categoryId: string }>({
      query: ({ shopId, categoryId }) => ({
        url: `/shops/${shopId}/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ShopCategory', 'EffectiveMenu'],
    }),
    getShopMenuItems: builder.query<GetShopMenuItemResponse[], string>({
      query: (shopId) => ({ url: `/shops/${shopId}/menu-items`, method: 'GET' }),
      providesTags: ['ShopMenuItem'],
    }),
    upsertShopMenuItem: builder.mutation<
      GetShopMenuItemResponse,
      { shopId: string; menuItemId: string; body: UpdateShopMenuItemRequest }
    >({
      query: ({ shopId, menuItemId, body }) => ({
        url: `/shops/${shopId}/menu-items/${menuItemId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ShopMenuItem', 'EffectiveMenu'],
    }),
    deleteShopMenuItem: builder.mutation<void, { shopId: string; menuItemId: string }>({
      query: ({ shopId, menuItemId }) => ({
        url: `/shops/${shopId}/menu-items/${menuItemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ShopMenuItem', 'EffectiveMenu'],
    }),

    // ---------------- Team Management (Feature 02) ----------------
    getTeamMembers: builder.query<
      PaginatedResponse<GetTeamMemberResponse>,
      {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        shopId?: string;
        includeDeleted?: boolean;
      }
    >({
      query: (params) => ({ url: '/users', method: 'GET', params }),
      providesTags: ['TeamMember'],
    }),
    getTeamMemberById: builder.query<GetTeamMemberResponse, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'TeamMember', id }],
    }),
    createTeamMember: builder.mutation<GetTeamMemberResponse, CreateTeamMemberRequest>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['TeamMember'],
    }),
    updateTeamMember: builder.mutation<
      GetTeamMemberResponse,
      { id: string; body: UpdateTeamMemberRequest }
    >({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'TeamMember', id }, 'TeamMember'],
    }),
    deleteTeamMember: builder.mutation<DeleteTeamMemberResponse, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TeamMember'],
    }),
    updateTeamMemberRole: builder.mutation<
      GetTeamMemberResponse,
      { id: string; body: UpdateTeamMemberRoleRequest }
    >({
      query: ({ id, body }) => ({ url: `/users/${id}/role`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'TeamMember', id }, 'TeamMember'],
    }),
    assignTeamMemberShops: builder.mutation<
      GetTeamMemberResponse,
      { id: string; body: AssignTeamMemberShopsRequest }
    >({
      query: ({ id, body }) => ({ url: `/users/${id}/shops`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'TeamMember', id }, 'TeamMember'],
    }),
    adminResetPassword: builder.mutation<AdminResetPasswordResponse, string>({
      query: (id) => ({ url: `/users/${id}/reset-password`, method: 'POST' }),
    }),
  }),
});

export const {
  // Auth
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useInitiatePasswordResetMutation,
  useCompletePasswordResetMutation,
  // Users
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useUpdateCurrentUserMutation,
  useChangePasswordMutation,
  useUploadProfilePhotoMutation,
  // Companies
  useCreateCompanyMutation,
  // Companies House
  useSearchCompaniesHouseQuery,
  useLazySearchCompaniesHouseQuery,
  useLookupCompaniesHouseQuery,
  useLazyLookupCompaniesHouseQuery,
  // Config enums
  useGetBusinessTypesQuery,
  useGetBusinessCategoriesQuery,
  useGetAnnualTurnoverBandsQuery,
  useGetPaymentMethodsQuery,
  // Shops
  useGetShopsQuery,
  useGetShopByIdQuery,
  useCreateShopMutation,
  useUpdateShopMutation,
  useArchiveShopMutation,
  useUnarchiveShopMutation,
  useReorderShopsMutation,
  // Categories
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
  // Menu Items
  useGetMenuItemsQuery,
  useGetMenuItemByIdQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  // Menu Addons
  useGetMenuAddonsQuery,
  useGetMenuAddonByIdQuery,
  useCreateMenuAddonMutation,
  useUpdateMenuAddonMutation,
  useDeleteMenuAddonMutation,
  useCreateMenuAddonOptionMutation,
  useUpdateMenuAddonOptionMutation,
  useDeleteMenuAddonOptionMutation,
  // Effective Menu
  useGetEffectiveMenuQuery,
  // Shop Overrides
  useGetShopCategoriesQuery,
  useUpsertShopCategoryMutation,
  useDeleteShopCategoryMutation,
  useGetShopMenuItemsQuery,
  useUpsertShopMenuItemMutation,
  useDeleteShopMenuItemMutation,
  // Team Management
  useGetTeamMembersQuery,
  useGetTeamMemberByIdQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useUpdateTeamMemberRoleMutation,
  useAssignTeamMemberShopsMutation,
  useAdminResetPasswordMutation,
} = yellowladderApi;
