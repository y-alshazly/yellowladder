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
  useAppDispatch,
  useAppSelector,
} from '@yellowladder/shared-store';
import type { AuthenticatedUser, AuthTokens, RefreshResponse } from '@yellowladder/shared-types';
import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

async function performHttpRefresh(
  refreshToken: string,
  csrfToken: string,
): Promise<RefreshResponse | null> {
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
    if (!response.ok) return null;
    return (await response.json()) as RefreshResponse;
  } catch {
    return null;
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
 *   4. On success, fetch /users/me to populate the auth slice user.
 *   5. On failure, mark the auth slice unauthenticated.
 *
 * The children render once the auth slice transitions out of the
 * `hydrating` state.
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
        const refreshed = await performHttpRefresh(stored.refreshToken, stored.csrfToken);
        if (cancelled) return;
        if (!refreshed) {
          await clearRefreshToken();
          dispatch(markUnauthenticated());
          return;
        }
        await saveRefreshToken(refreshed.tokens);
        // Fetch /users/me with the new access token so we can populate the
        // slice user. Going through RTK Query guarantees the Authorization
        // header is injected from the fresh slice state.
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
  // React 19 supports returning ReactNode directly from a function component.
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
