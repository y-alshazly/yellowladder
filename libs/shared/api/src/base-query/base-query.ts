import {
  fetchBaseQuery,
  type BaseQueryApi,
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

type RefreshOutcome = 'ok' | 'rejected' | 'transient';

/**
 * Shared in-flight refresh promise. Serializes concurrent 401-recoveries so
 * that multiple parallel requests do not each POST /auth/refresh with the
 * same (single-use) refresh token — a race that would leave one request
 * succeeding and the others 401ing on a now-rotated token, booting the
 * user out despite a valid session being re-established.
 */
let inflightRefresh: Promise<RefreshOutcome> | null = null;

async function refreshSession(api: BaseQueryApi): Promise<RefreshOutcome> {
  if (inflightRefresh) {
    return inflightRefresh;
  }
  inflightRefresh = (async (): Promise<RefreshOutcome> => {
    try {
      if (!refreshTokenAccessor) return 'rejected';
      const stored = await refreshTokenAccessor.read();
      if (!stored) return 'rejected';
      const state = api.getState() as Parameters<typeof selectCsrfToken>[0];
      const csrfToken = selectCsrfToken(state) ?? stored.csrfToken;
      const baseQuery = rawBaseQuery();
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
        {},
      );
      if (refreshResult.error || !refreshResult.data) {
        const status = refreshResult.error?.status;
        const isExplicitRejection = status === 401 || status === 403;
        return isExplicitRejection ? 'rejected' : 'transient';
      }
      const refreshed = refreshResult.data as RefreshResponse;
      await refreshTokenAccessor.write(refreshed.tokens);
      api.dispatch(
        setCredentials({
          tokens: refreshed.tokens,
          user: ((api.getState() as { auth: { user: AuthenticatedUser | null } }).auth.user ??
            undefinedUser) as AuthenticatedUser,
        }),
      );
      return 'ok';
    } catch {
      return 'transient';
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

/**
 * RTK Query base query with automatic refresh-token retry on 401.
 *
 * Flow:
 *   1. Fire the original request.
 *   2. On 401, join the single shared `refreshSession` promise. Concurrent
 *      callers share one refresh instead of each POSTing /auth/refresh and
 *      racing to consume the same single-use token.
 *   3. If the refresh succeeded, retry the original request exactly once —
 *      the caller never sees the 401.
 *   4. If the refresh was explicitly REJECTED (401/403 from /auth/refresh —
 *      token expired, reused, or revoked), wipe Keychain + flip Redux to
 *      `unauthenticated` so `RootNavigator` sends the user to the login
 *      stack. The original 401 still surfaces to the caller so the
 *      in-flight mutation/query fails cleanly.
 *   5. If the refresh failed TRANSIENTLY (network error, 5xx, timeout),
 *      surface the original 401 but keep the session. The next attempt
 *      (manual retry, background refetch, or next app launch) gets
 *      another shot with the same refresh token.
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
      return initialResult;
    }
    const outcome = await refreshSession(api);
    if (outcome === 'ok') {
      return await baseQuery(args, api, extraOptions);
    }
    if (outcome === 'rejected') {
      await refreshTokenAccessor.clear();
      api.dispatch(markUnauthenticated());
    }
    return initialResult;
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
