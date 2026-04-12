import type { AuthTokens } from '@yellowladder/shared-types';

/**
 * Secure refresh-token storage for mobile. Backed by `react-native-keychain`
 * when the native module is available. All methods are async; callers must
 * await them.
 *
 * We import `react-native-keychain` lazily so that this lib can still be
 * type-checked in environments where the native module isn't linked (e.g.
 * unit tests, Storybook, web shells). When the module is missing every
 * call becomes a no-op and the app falls through to the unauthenticated
 * state on the next refresh attempt.
 *
 * NEVER store tokens in AsyncStorage. NEVER accept a synchronous
 * implementation — Keychain access is asynchronous.
 */

const SERVICE = 'com.yellowladder.mobile.auth';
const USERNAME = 'refresh';

interface KeychainModule {
  setGenericPassword: (
    username: string,
    password: string,
    options?: { service?: string; accessible?: string },
  ) => Promise<unknown>;
  getGenericPassword: (options?: {
    service?: string;
  }) => Promise<false | { password: string; username: string }>;
  resetGenericPassword: (options?: { service?: string }) => Promise<boolean>;
  ACCESSIBLE?: {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY?: string;
  };
}

function loadKeychain(): KeychainModule | null {
  try {
    const mod = require('react-native-keychain') as KeychainModule;
    return mod;
  } catch {
    return null;
  }
}

export interface StoredRefreshBundle {
  refreshToken: string;
  csrfToken: string;
}

/**
 * Persist the refresh token + CSRF token together in the Keychain. The
 * payload is encoded as JSON so both values round-trip atomically.
 */
export async function saveRefreshToken(tokens: AuthTokens): Promise<void> {
  const keychain = loadKeychain();
  if (!keychain) return;
  if (!tokens.refreshToken) return;
  const payload: StoredRefreshBundle = {
    refreshToken: tokens.refreshToken,
    csrfToken: tokens.csrfToken,
  };
  await keychain.setGenericPassword(USERNAME, JSON.stringify(payload), {
    service: SERVICE,
    accessible: keychain.ACCESSIBLE?.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function loadRefreshToken(): Promise<StoredRefreshBundle | null> {
  const keychain = loadKeychain();
  if (!keychain) return null;
  const result = await keychain.getGenericPassword({ service: SERVICE });
  if (!result) return null;
  try {
    const parsed = JSON.parse(result.password) as StoredRefreshBundle;
    if (!parsed.refreshToken || !parsed.csrfToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearRefreshToken(): Promise<void> {
  const keychain = loadKeychain();
  if (!keychain) return;
  await keychain.resetGenericPassword({ service: SERVICE });
}
