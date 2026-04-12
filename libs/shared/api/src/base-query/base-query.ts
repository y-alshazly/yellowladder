import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import {
  markUnauthenticated,
  selectAccessToken,
  selectCsrfToken,
  setCredentials,
} from '@yellowladder/shared-store';
import type { AuthTokens, AuthenticatedUser, RefreshResponse } from '@yellowladder/shared-types';
import { YELLOWLADDER_API_BASE_URL } from '../config/base-url.config';

/**
 * The async refresh-token reader is injected by the app shell so this lib
 * doesn't take a hard dependency on `react-native-keychain`. Web will
 * eventually inject a no-op (the refresh token lives in an HttpOnly cookie
 * there), mobile injects the Keychain reader.
 */
export interface RefreshTokenAccessor {
  read(): Promise<{ refreshToken: string; csrfToken: string } | null>;
  write(tokens: AuthTokens, user?: AuthenticatedUser): Promise<void>;
  clear(): Promise<void>;
}

let refreshTokenAccessor: RefreshTokenAccessor | null = null;

export function registerRefreshTokenAccessor(accessor: RefreshTokenAccessor): void {
  refreshTokenAccessor = accessor;
}

/**
 * Client platform marker. The backend reads the `X-Client-Platform` header to
 * decide whether refresh tokens should flow in an HttpOnly cookie (web) or in
 * the JSON response body for `react-native-keychain` storage (mobile). The app
 * shell must call `registerClientPlatform` once at startup. Defaults to 'web'
 * so that, if the registration is ever skipped, the safer cookie-based flow
 * kicks in instead of leaking a refresh token into a body that nobody stores.
 */
export type ClientPlatform = 'web' | 'mobile';

let clientPlatform: ClientPlatform = 'web';

export function registerClientPlatform(platform: ClientPlatform): void {
  clientPlatform = platform;
}

function rawBaseQuery() {
  return fetchBaseQuery({
    baseUrl: YELLOWLADDER_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as Parameters<typeof selectAccessToken>[0];
      const token = selectAccessToken(state);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      headers.set('X-Client-Platform', clientPlatform);
      return headers;
    },
  });
}

/**
 * RTK Query base query with automatic refresh-token retry on 401.
 *
 * Flow:
 *   1. Fire the original request.
 *   2. If it returns 401, read the refresh token from the injected accessor.
 *   3. POST /auth/refresh with the refresh token as a Bearer header and the
 *      CSRF token as `X-CSRF-Token`.
 *   4. On success, dispatch `setCredentials` and retry the original request
 *      exactly once. On failure, dispatch `markUnauthenticated` and bail.
 */
export const yellowladderBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const baseQuery = rawBaseQuery();
  const initialResult = await baseQuery(args, api, extraOptions);
  if (initialResult.error && initialResult.error.status === 401) {
    if (!refreshTokenAccessor) {
      api.dispatch(markUnauthenticated());
      return initialResult;
    }
    const stored = await refreshTokenAccessor.read();
    if (!stored) {
      api.dispatch(markUnauthenticated());
      return initialResult;
    }
    const state = api.getState() as Parameters<typeof selectCsrfToken>[0];
    const csrfToken = selectCsrfToken(state) ?? stored.csrfToken;
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stored.refreshToken}`,
          'X-CSRF-Token': csrfToken,
        },
        body: {},
      },
      api,
      extraOptions,
    );
    if (refreshResult.error || !refreshResult.data) {
      await refreshTokenAccessor.clear();
      api.dispatch(markUnauthenticated());
      return initialResult;
    }
    const refreshed = refreshResult.data as RefreshResponse;
    await refreshTokenAccessor.write(refreshed.tokens);
    api.dispatch(
      setCredentials({
        tokens: refreshed.tokens,
        // On a refresh we don't get a new user payload — re-use the existing
        // one from the store by passing whatever is currently there.
        user: ((api.getState() as { auth: { user: AuthenticatedUser | null } }).auth.user ??
          undefinedUser) as AuthenticatedUser,
      }),
    );
    return await baseQuery(args, api, extraOptions);
  }
  return initialResult;
};

// Placeholder used when refreshing before a user is hydrated. The
// `setCredentials` reducer tolerates this because we only call it when the
// store already has a user — otherwise we bail via `markUnauthenticated`.
const undefinedUser: AuthenticatedUser = {
  id: '',
  email: '',
  firstName: null,
  lastName: null,
  phoneE164: '',
  phoneCountryCode: '',
  countryCode: '',
  role: 'COMPANY_ADMIN',
  companyId: null,
  shopIds: [],
  emailVerified: false,
  onboardingPhase: 'PHASE_A_REGISTERED',
  profilePhotoUrl: null,
  createdAt: '',
  updatedAt: '',
};
