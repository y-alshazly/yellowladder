import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  useCreateCompanyMutation,
  useRegisterMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
} from '@yellowladder/shared-api';
import { AuthScreenLayout, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { resetWizard, setCredentials, useAppDispatch } from '@yellowladder/shared-store';
import {
  BusinessType,
  IdentityAuthenticationErrors,
  IdentityCompaniesErrors,
  type AuthenticatedUser,
  type CreateCompanyRequest,
  type OtpVerifyResponse,
} from '@yellowladder/shared-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OtpCodeInput } from '../components/otp-code-input.component';
import { saveRefreshToken } from '../hooks/use-secure-refresh-token.hook';
import { useWizardDraft } from '../hooks/use-wizard-draft.hook';
import type { AuthStackNavigationProp, AuthStackParamList } from '../navigation/auth-stack.types';
import { maskEmail } from '../utils/mask-email.util';

const OTP_TTL_SECONDS = 300; // 5:00 countdown per architect §1.3

type OtpVerifyRouteProp = RouteProp<AuthStackParamList, 'VerifyEmail'>;

interface CountdownDisplay {
  mmss: string;
  expired: boolean;
}

function formatCountdown(remainingSeconds: number): CountdownDisplay {
  const safe = Math.max(0, remainingSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  const mmss = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return { mmss, expired: safe === 0 };
}

/**
 * OTP verification — the FINAL step of onboarding (2026-04-11 routing
 * change). After a successful OTP verification this screen fires the
 * accumulated `POST /companies` payload assembled during the wizard.
 *
 * Visual layout matches `verify-email-otp-tablet.png`: a white card with
 * a faded cloud watermark backdrop, the small `tappd` wordmark top-left,
 * a large envelope icon above the title, the masked email subtitle, the
 * 6-cell code input, the expiry countdown and the resend link.
 */
export function OtpVerifyScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const route = useRoute<OtpVerifyRouteProp>();
  const dispatch = useAppDispatch();
  const email = route.params.email;
  const masked = useMemo(() => maskEmail(email), [email]);

  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [requestOtp, { isLoading: isRequesting }] = useRequestOtpMutation();
  const [createCompany, { isLoading: isCreatingCompany }] = useCreateCompanyMutation();
  const { state: draft } = useWizardDraft();

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(OTP_TTL_SECONDS);
  const [registered, setRegistered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const registrationAttemptedRef = useRef(false);

  // Register the user on mount (deferred from signup step 1)
  useEffect(() => {
    if (registrationAttemptedRef.current || !draft.accountData) return;
    registrationAttemptedRef.current = true;

    (async () => {
      try {
        const regResult = await registerUser(draft.accountData!).unwrap();
        await saveRefreshToken(regResult.tokens);
        dispatch(
          setCredentials({
            tokens: regResult.tokens,
            user: regResult.user,
            resumeAt: regResult.resumeAt,
          }),
        );
        setRegistered(true);
      } catch (err) {
        const error = err as { status?: number; data?: { errorCode?: string } };
        if (error.data?.errorCode === 'IDENTITY.AUTHENTICATION.DUPLICATE_EMAIL') {
          setErrorMessage(t('auth.signup.duplicateEmail'));
        } else if (error.status === 429) {
          setErrorMessage(t('auth.login.rateLimited'));
        } else {
          setErrorMessage(t('common.somethingWentWrong'));
        }
      }
    })();
  }, [draft.accountData, registerUser, dispatch, t]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const countdown = formatCountdown(remainingSeconds);

  const submitCompanyCreation = async (): Promise<void> => {
    console.warn('submitCompanyCreation called', {
      idempotencyKey: draft.idempotencyKey,
      businessCategoryId: draft.businessProfile.businessCategoryId,
      paymentMethodPreferenceId: draft.businessProfile.paymentMethodPreferenceId,
      annualTurnoverBandId: draft.businessProfile.annualTurnoverBandId,
      businessType: draft.businessType,
      companiesHouseLookup: !!draft.companiesHouseLookup,
      selfEmployed: draft.selfEmployed,
    });
    if (
      !draft.idempotencyKey ||
      !draft.businessProfile.businessCategoryId ||
      !draft.businessProfile.paymentMethodPreferenceId ||
      !draft.businessProfile.annualTurnoverBandId
    ) {
      console.warn('submitCompanyCreation: missing required fields');
      setErrorMessage(t('common.somethingWentWrong'));
      return;
    }

    // Create the company (user was registered on mount)
    const businessProfile = {
      businessCategoryId: draft.businessProfile.businessCategoryId,
      paymentMethodPreferenceId: draft.businessProfile.paymentMethodPreferenceId,
      annualTurnoverBandId: draft.businessProfile.annualTurnoverBandId,
      vatRegistered: draft.businessProfile.vatRegistered ?? false,
      vatNumber: draft.businessProfile.vatNumber || null,
    };
    const authorisationConfirmedAt = draft.authorisationConfirmedAt ?? new Date().toISOString();

    let payload: CreateCompanyRequest | null = null;

    if (draft.businessType === BusinessType.LimitedCompany && draft.companiesHouseLookup) {
      const selectedContact = draft.contacts.find(
        (contact) => contact.id === draft.selectedContactId,
      );
      console.warn(
        'selectedContact:',
        selectedContact,
        'selectedContactId:',
        draft.selectedContactId,
        'contacts:',
        draft.contacts,
      );
      if (!selectedContact) {
        console.warn('submitCompanyCreation: no selected contact');
        setErrorMessage(t('common.somethingWentWrong'));
        return;
      }
      const overriddenName = draft.companyOverrides.name ?? draft.companiesHouseLookup.companyName;
      payload = {
        idempotencyKey: draft.idempotencyKey,
        businessProfile,
        details: {
          businessType: 'LIMITED_COMPANY',
          registrationNumber: draft.companiesHouseLookup.registrationNumber,
          companyName: overriddenName,
          tradingName: overriddenName,
          registeredAddress: draft.companiesHouseLookup.registeredAddress,
          incorporationDate: draft.companiesHouseLookup.incorporationDate,
          primaryContact: {
            source: selectedContact.source === 'COMPANIES_HOUSE' ? 'PSC' : 'MANUAL',
            pscId: selectedContact.source === 'COMPANIES_HOUSE' ? selectedContact.id : undefined,
            firstName: selectedContact.firstName,
            lastName: selectedContact.lastName,
            jobPosition: selectedContact.jobPosition ?? '',
          },
        },
        authorisationConfirmedAt,
      };
    } else if (draft.businessType === BusinessType.SelfEmployed && draft.selfEmployed) {
      const se = draft.selfEmployed;
      if (
        !se.firstName ||
        !se.lastName ||
        !se.jobPosition ||
        !se.dateOfBirth ||
        !se.legalBusinessName ||
        !se.tradingName ||
        !se.registeredAddress ||
        se.storeIsSameAddress === undefined
      ) {
        setErrorMessage(t('common.somethingWentWrong'));
        return;
      }
      payload = {
        idempotencyKey: draft.idempotencyKey,
        businessProfile,
        details: {
          businessType: 'SELF_EMPLOYED',
          firstName: se.firstName,
          lastName: se.lastName,
          jobPosition: se.jobPosition,
          dateOfBirth: se.dateOfBirth,
          legalBusinessName: se.legalBusinessName,
          tradingName: se.tradingName,
          registeredAddress: se.registeredAddress,
          storeIsSameAddress: se.storeIsSameAddress,
        },
        authorisationConfirmedAt,
      };
    }

    if (!payload) {
      setErrorMessage(t('common.somethingWentWrong'));
      return;
    }

    try {
      console.warn('createCompany payload:', JSON.stringify(payload, null, 2));
      const result = await createCompany(payload).unwrap();
      console.warn('createCompany success:', result.user?.companyId);
      await saveRefreshToken(result.tokens);
      const nextUser: AuthenticatedUser = {
        ...result.user,
        emailVerified: true,
        onboardingPhase: 'PHASE_C_COMPLETED',
      };
      dispatch(resetWizard());
      dispatch(setCredentials({ tokens: result.tokens, user: nextUser }));
      // App shell routes to the authenticated stack because companyId is set.
    } catch (err) {
      console.warn('createCompany error:', JSON.stringify(err, null, 2));
      const error = err as { status?: number; data?: { errorCode?: string } };
      if (error.data?.errorCode === IdentityCompaniesErrors.CompanyAlreadyExists) {
        setErrorMessage(t('wizard.submit.alreadyExists'));
      } else {
        setErrorMessage(t('common.somethingWentWrong'));
      }
    }
  };

  const handleVerify = async (nextCode: string): Promise<void> => {
    if (nextCode.length !== 6) return;
    setErrorMessage(null);
    try {
      const result: OtpVerifyResponse = await verifyOtp({
        email,
        code: nextCode,
      }).unwrap();
      await saveRefreshToken(result.tokens);
      dispatch(
        setCredentials({
          tokens: result.tokens,
          user: result.user,
          resumeAt: null,
        }),
      );
      // Resume flow:
      //   - If the user already had a company (login-resume edge case),
      //     the app shell switches to the authenticated navigator.
      //   - If the user is mid-onboarding (the expected path) we fire
      //     `POST /companies` right here so the final state lands in one
      //     transaction.
      if (!result.user.companyId) {
        try {
          await submitCompanyCreation();
        } catch (companyErr) {
          console.warn('Company creation failed:', companyErr);
        }
      }
      // If the user has a companyId the app-shell router picks the main
      // stack automatically — nothing else to do.
    } catch (err) {
      const error = err as {
        status?: number;
        data?: { errorCode?: string; metadata?: { remainingAttempts?: number } };
      };
      const errorCode = error.data?.errorCode;
      if (error.data?.metadata?.remainingAttempts !== undefined) {
        setRemainingAttempts(error.data.metadata.remainingAttempts);
      }
      if (errorCode === IdentityAuthenticationErrors.OtpInvalid) {
        setErrorMessage(
          t('auth.verifyEmail.invalidCode', {
            remainingAttempts: error.data?.metadata?.remainingAttempts ?? '—',
          }),
        );
      } else if (errorCode === IdentityAuthenticationErrors.OtpExpired) {
        setErrorMessage(t('auth.verifyEmail.codeExpired'));
      } else if (errorCode === IdentityAuthenticationErrors.OtpAttemptsExceeded) {
        setErrorMessage(t('auth.verifyEmail.attemptsExceeded'));
      } else if (errorCode === IdentityAuthenticationErrors.OtpRateLimited) {
        setErrorMessage(t('auth.verifyEmail.rateLimited', { minutes: 15 }));
      } else {
        setErrorMessage(t('common.somethingWentWrong'));
      }
    }
  };

  const handleChange = (next: string): void => {
    setCode(next);
    if (next.length === 6) {
      void handleVerify(next);
    }
  };

  const handleResend = async (): Promise<void> => {
    setErrorMessage(null);
    setCode('');
    setRemainingAttempts(null);
    try {
      await requestOtp({ email }).unwrap();
      setRemainingSeconds(OTP_TTL_SECONDS);
    } catch {
      setErrorMessage(t('common.somethingWentWrong'));
    }
  };

  const busy = isVerifying || isRegistering || isCreatingCompany;

  // navigation currently unused on this screen but kept for future
  // back-to-wizard recovery flows; referenced here to silence eslint.
  void navigation;

  return (
    <AuthScreenLayout variant="solo">
      <View style={styles.centerBlock}>
        <Icon
          name="email-outline"
          size={44}
          color={theme.colors.onSurface}
          accessibilityLabel={t('auth.verifyEmail.title')}
        />
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onSurface, marginTop: theme.spacing.md }]}
        >
          {t('auth.verifyEmail.title')}
        </Text>
        <Text
          variant="bodyMedium"
          style={[
            styles.subtitle,
            {
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.xs,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          {t('auth.verifyEmail.subtitle', { maskedEmail: masked })}
        </Text>
        <OtpCodeInput value={code} onChange={handleChange} error={errorMessage ?? undefined} />
        <Text
          variant="labelMedium"
          style={{
            color: countdown.expired ? theme.colors.error : theme.colors.onSurfaceVariant,
            textAlign: 'center',
            marginTop: theme.spacing.xs,
          }}
        >
          {t('auth.verifyEmail.expiresIn', { mmss: countdown.mmss })}
        </Text>
        {remainingAttempts !== null ? (
          <HelperText type="info" visible>
            {t('auth.verifyEmail.invalidCode', { remainingAttempts })}
          </HelperText>
        ) : null}
        <View style={[styles.resendRow, { marginTop: theme.spacing.md }]}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {t('auth.otp.noEmail')}{' '}
          </Text>
          <Button
            mode="text"
            compact
            onPress={handleResend}
            disabled={isRequesting || busy}
            loading={isRequesting}
          >
            {t('auth.otp.resend')}
          </Button>
        </View>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  centerBlock: { alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
