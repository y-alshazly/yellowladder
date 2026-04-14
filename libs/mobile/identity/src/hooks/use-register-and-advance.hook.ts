import { useRegisterMutation } from '@yellowladder/shared-api';
import { setCredentials, useAppDispatch } from '@yellowladder/shared-store';
import type { RegisterRequest } from '@yellowladder/shared-types';
import { IdentityAuthenticationErrors } from '@yellowladder/shared-types';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { saveRefreshToken } from './use-secure-refresh-token.hook';

interface UseRegisterAndAdvanceResult {
  register: (accountData: RegisterRequest) => Promise<boolean>;
  isRegistering: boolean;
  error: string | null;
  clearError: () => void;
}

function extractApiErrorMessage(err: unknown): {
  status?: number;
  errorCode?: string;
  message?: string;
  messages?: string[];
} {
  const error = err as {
    status?: number;
    data?: { errorCode?: string; message?: string | string[] };
  };
  const rawMessage = error.data?.message;
  return {
    status: error.status,
    errorCode: error.data?.errorCode,
    message: typeof rawMessage === 'string' ? rawMessage : undefined,
    messages: Array.isArray(rawMessage) ? rawMessage : undefined,
  };
}

/**
 * Registers the user via `POST /auth/register`, stores the returned tokens
 * in Keychain + Redux, and returns `true` on success. On failure the hook
 * sets a human-readable `error` string (localized) and returns `false`.
 *
 * Used by the final step of each wizard branch (WizardPrimaryContact for
 * limited companies, WizardSelfEmployed for self-employed) so registration
 * errors surface on the wizard page — NOT on the OTP screen.
 */
export function useRegisterAndAdvance(): UseRegisterAndAdvanceResult {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (accountData: RegisterRequest): Promise<boolean> => {
      setError(null);
      try {
        const result = await registerUser(accountData).unwrap();
        await saveRefreshToken(result.tokens);
        dispatch(
          setCredentials({
            tokens: result.tokens,
            user: result.user,
            resumeAt: result.resumeAt,
          }),
        );
        return true;
      } catch (err) {
        const { status, errorCode, message, messages } = extractApiErrorMessage(err);
        if (errorCode === IdentityAuthenticationErrors.DuplicateEmail) {
          setError(t('auth.signup.duplicateEmail'));
        } else if (status === 429) {
          setError(t('auth.login.rateLimited'));
        } else if (status === 400 && (messages?.length || message)) {
          const detail = messages?.[0] ?? message ?? '';
          setError(t('auth.signup.registrationFailed', { details: detail }));
        } else if (!status) {
          setError(t('common.networkError'));
        } else if (status >= 500) {
          setError(t('common.serverError'));
        } else {
          setError(t('auth.signup.registrationFailed', { details: message ?? `Error ${status}` }));
        }
        return false;
      }
    },
    [registerUser, dispatch, t],
  );

  const clearError = useCallback(() => setError(null), []);

  return { register, isRegistering, error, clearError };
}
