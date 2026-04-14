import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AuthTokens,
  AuthenticatedUser,
  OnboardingResumePoint,
} from '@yellowladder/shared-types';

export interface AuthState {
  /**
   * In-memory access token. NEVER persisted. Cleared on app launch until
   * the refresh token is read from Keychain and exchanged.
   */
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  /**
   * CSRF token ridden on /auth/refresh. On mobile this is read from the
   * auth response body and persisted alongside the refresh token in
   * Keychain — this slice carries the in-memory mirror.
   */
  csrfToken: string | null;
  user: AuthenticatedUser | null;
  resumeAt: OnboardingResumePoint | null;
  /**
   * Tracks the hydration attempt from Keychain on app launch. While
   * `status === 'hydrating'` the splash / loading UI should render.
   */
  status: 'hydrating' | 'authenticated' | 'unauthenticated';
}

const initialState: AuthState = {
  accessToken: null,
  accessTokenExpiresAt: null,
  csrfToken: null,
  user: null,
  resumeAt: null,
  status: 'hydrating',
};

interface SetCredentialsPayload {
  tokens: AuthTokens;
  user: AuthenticatedUser;
  resumeAt?: OnboardingResumePoint | null;
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<SetCredentialsPayload>) {
      state.accessToken = action.payload.tokens.accessToken;
      state.accessTokenExpiresAt = action.payload.tokens.accessTokenExpiresAt;
      state.csrfToken = action.payload.tokens.csrfToken;
      state.user = action.payload.user;
      state.resumeAt = action.payload.resumeAt ?? state.resumeAt;
      state.status = 'authenticated';
    },
    /**
     * Sets tokens without touching user / status. Used when the access token
     * is refreshed before the user payload is available (e.g. during app
     * hydration) so that subsequent RTK Query calls attach the correct
     * Authorization header.
     */
    setTokens(state, action: PayloadAction<AuthTokens>) {
      state.accessToken = action.payload.accessToken;
      state.accessTokenExpiresAt = action.payload.accessTokenExpiresAt;
      state.csrfToken = action.payload.csrfToken;
    },
    setResumeAt(state, action: PayloadAction<OnboardingResumePoint | null>) {
      state.resumeAt = action.payload;
    },
    setUser(state, action: PayloadAction<AuthenticatedUser>) {
      state.user = action.payload;
    },
    markUnauthenticated(state) {
      state.accessToken = null;
      state.accessTokenExpiresAt = null;
      state.csrfToken = null;
      state.user = null;
      state.resumeAt = null;
      state.status = 'unauthenticated';
    },
    markHydrationFailed(state) {
      state.status = 'unauthenticated';
    },
  },
});

export const {
  setCredentials,
  setTokens,
  setResumeAt,
  setUser,
  markUnauthenticated,
  markHydrationFailed,
} = authSlice.actions;

export const authReducer = authSlice.reducer;

// Selectors
export const selectAuthState = (state: { auth: AuthState }): AuthState => state.auth;
export const selectAccessToken = (state: { auth: AuthState }): string | null =>
  state.auth.accessToken;
export const selectCsrfToken = (state: { auth: AuthState }): string | null => state.auth.csrfToken;
export const selectCurrentUser = (state: { auth: AuthState }): AuthenticatedUser | null =>
  state.auth.user;
export const selectAuthStatus = (state: { auth: AuthState }): AuthState['status'] =>
  state.auth.status;
export const selectResumeAt = (state: { auth: AuthState }): OnboardingResumePoint | null =>
  state.auth.resumeAt;
