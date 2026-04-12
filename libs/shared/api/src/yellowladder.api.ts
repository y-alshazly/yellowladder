import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  AnnualTurnoverOption,
  AuthenticatedUser,
  BusinessCategoryOption,
  BusinessTypeOption,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CompaniesHouseLookupResponse,
  CompaniesHouseSearchRequest,
  CompaniesHouseSearchResponse,
  CreateCompanyRequest,
  CreateCompanyResponse,
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
  UploadProfilePhotoResponse,
} from '@yellowladder/shared-types';
import { yellowladderBaseQuery } from './base-query/base-query';

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
} = yellowladderApi;
