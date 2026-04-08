// @ts-nocheck
// CANONICAL EXAMPLE: RTK Query API Slice Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new shared/api endpoint.
//
// Key conventions demonstrated:
// 1. One API slice per backend domain (catalogApi, orderingApi, etc.)
// 2. Lives in libs/shared/api/{domain}/
// 3. Imports types from @yellowladder/shared-types — NEVER from backend libs
// 4. Endpoint names match REST verbs: getX, getXById, createX, updateX, deleteX
// 5. Tag types per slice for cache invalidation
// 6. Base URL is /api/v1 — configured once in the base query, never in endpoint paths
// 7. Auth header injection via prepareHeaders reading the in-memory access token from shared/store
// 8. Refresh-on-401: the base query wraps fetch and retries after a /refresh call

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type {
  CreateMenuItemRequest,
  GetMenuItemResponse,
  GetMenuItemsRequest,
  PaginatedResponse,
  UpdateMenuItemRequest,
} from '@yellowladder/shared-types';
import type { RootState } from '@yellowladder/shared-store';

// --- Base query: /api/v1 + access token + refresh-on-401 ---

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  // The access token lives in memory only — never localStorage.
  // It's stored in the auth slice and read here at request time.
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken;
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return headers;
  },
  // The refresh token lives in an HttpOnly cookie — sent automatically by the browser.
  credentials: 'include',
});

// Wrap with refresh-on-401 logic. On a 401, attempt to refresh the access token,
// then retry the original request once.
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      // Store the new access token in the auth slice
      const { accessToken } = refreshResult.data as { accessToken: string };
      api.dispatch({ type: 'auth/setAccessToken', payload: accessToken });
      // Retry the original request
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — log the user out
      api.dispatch({ type: 'auth/logout' });
    }
  }

  return result;
};

// --- API slice: Catalog domain ---

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['MenuItem', 'Category', 'MenuAddon', 'ShopMenuItem'],
  endpoints: (build) => ({
    // Read many — paginated
    getMenuItems: build.query<PaginatedResponse<GetMenuItemResponse>, GetMenuItemsRequest>({
      query: (params) => ({ url: '/menu-items', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'MenuItem' as const, id })),
              { type: 'MenuItem', id: 'LIST' },
            ]
          : [{ type: 'MenuItem', id: 'LIST' }],
    }),

    // Read one
    getMenuItemById: build.query<GetMenuItemResponse, string>({
      query: (id) => `/menu-items/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'MenuItem', id }],
    }),

    // Create
    createMenuItem: build.mutation<GetMenuItemResponse, CreateMenuItemRequest>({
      query: (body) => ({ url: '/menu-items', method: 'POST', body }),
      invalidatesTags: [{ type: 'MenuItem', id: 'LIST' }],
    }),

    // Update
    updateMenuItem: build.mutation<
      GetMenuItemResponse,
      { id: string; body: UpdateMenuItemRequest }
    >({
      query: ({ id, body }) => ({ url: `/menu-items/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'MenuItem', id },
        { type: 'MenuItem', id: 'LIST' },
      ],
    }),

    // Delete
    deleteMenuItem: build.mutation<void, string>({
      query: (id) => ({ url: `/menu-items/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'MenuItem', id },
        { type: 'MenuItem', id: 'LIST' },
      ],
    }),
  }),
});

// Auto-generated hooks — used by web and mobile components
export const {
  useGetMenuItemsQuery,
  useGetMenuItemByIdQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
} = catalogApi;

// =====================================================================================
// NOTES
// =====================================================================================
//
// 1. shared/api may NOT import from @yellowladder/backend-* — it only mirrors REST contracts.
//    Request and response types come from @yellowladder/shared-types, which is also implemented
//    by the backend's class-validator DTOs. Single source of truth.
//
// 2. The Redux store is created in the app shell (apps/web-backoffice/ or apps/mobile-backoffice/),
//    not in shared/api. The app combines all domain API slices into the root reducer.
//
// 3. Tags are scoped per slice ('MenuItem', 'Category') — not global. Cache invalidation is
//    triggered by mutation invalidatesTags matching query providesTags.
//
// 4. The /api/v1 prefix is configured once here. When a v2 migration happens, this single
//    line changes — endpoint paths stay the same.
