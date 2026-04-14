import {
  clearRefreshToken,
  loadRefreshToken,
  saveRefreshToken,
} from '@yellowladder/mobile-identity';
import {
  registerClientPlatform,
  registerRefreshTokenAccessor,
  YELLOWLADDER_API_BASE_URL,
  yellowladderApi,
} from '@yellowladder/shared-api';
import {
  markHydrationFailed,
  markUnauthenticated,
  selectAuthStatus,
  setCredentials,
  setTokens,
  useAppDispatch,
  useAppSelector,
} from '@yellowladder/shared-store';
import type { AuthenticatedUser, AuthTokens, RefreshResponse } from '@yellowladder/shared-types';
import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type RefreshOutcome =
  | { kind: 'ok'; data: RefreshResponse }
  | { kind: 'rejected' } // backend explicitly rejected the refresh token
  | { kind: 'transient' }; // network / 5xx — do not clear the session

async function performHttpRefresh(
  refreshToken: string,
  csrfToken: string,
): Promise<RefreshOutcome> {
  try {
    const response = await fetch(`${YELLOWLADDER_API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
        'X-CSRF-Token': csrfToken,
        'X-Client-Platform': 'mobile',
      },
      body: JSON.stringify({}),
    });
    if (response.status === 401 || response.status === 403) {
      return { kind: 'rejected' };
    }
    if (!response.ok) {
      return { kind: 'transient' };
    }
    const data = (await response.json()) as RefreshResponse;
    return { kind: 'ok', data };
  } catch {
    return { kind: 'transient' };
  }
}

export interface AuthHydrationGateProps {
  children: ReactNode;
}

/**
 * On app mount:
 *   1. Register the Keychain-backed refresh-token accessor with the RTK
 *      Query base query so it can retry on 401.
 *   2. Read any persisted refresh token from Keychain.
 *   3. POST /auth/refresh with the stored refresh token + CSRF token.
 *   4. Dispatch `setTokens` so the fresh access token is in Redux BEFORE
 *      firing the /users/me query. This avoids a pointless 401 retry.
 *   5. Fetch /users/me, then dispatch `setCredentials` to finalise.
 *   6. Only clear the session on EXPLICIT refresh rejection. Network /
 *      5xx errors leave the existing refresh token in place so the next
 *      request can succeed.
 */
export function AuthHydrationGate({ children }: AuthHydrationGateProps) {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;
    registerClientPlatform('mobile');
    registerRefreshTokenAccessor({
      read: async () => {
        const stored = await loadRefreshToken();
        if (!stored) return null;
        return { refreshToken: stored.refreshToken, csrfToken: stored.csrfToken };
      },
      write: async (tokens: AuthTokens) => {
        await saveRefreshToken(tokens);
      },
      clear: async () => {
        await clearRefreshToken();
      },
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async (): Promise<void> => {
      try {
        const stored = await loadRefreshToken();
        if (!stored) {
          if (!cancelled) dispatch(markUnauthenticated());
          return;
        }
        const outcome = await performHttpRefresh(stored.refreshToken, stored.csrfToken);
        if (cancelled) return;
        if (outcome.kind === 'rejected') {
          await clearRefreshToken();
          dispatch(markUnauthenticated());
          return;
        }
        if (outcome.kind === 'transient') {
          // Network / 5xx — treat as "no session right now" without
          // clearing Keychain, so the next launch can try again.
          dispatch(markHydrationFailed());
          return;
        }
        const refreshed = outcome.data;
        await saveRefreshToken(refreshed.tokens);
        // Seed the access token into Redux FIRST so prepareHeaders picks
        // it up on the /users/me call that follows.
        dispatch(setTokens(refreshed.tokens));
        const userResult = await dispatch(
          yellowladderApi.endpoints.getCurrentUser.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap();
        if (cancelled) return;
        dispatch(
          setCredentials({
            tokens: refreshed.tokens,
            user: userResult as AuthenticatedUser,
          }),
        );
      } catch {
        if (!cancelled) dispatch(markHydrationFailed());
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (status === 'hydrating') {
    return (
      <View style={hydrationStyles.root}>
        <ActivityIndicator size="large" color="#C7A4F2" />
      </View>
    );
  }
  return children as unknown as ReturnType<typeof AuthHydrationGate>;
}

const hydrationStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});
