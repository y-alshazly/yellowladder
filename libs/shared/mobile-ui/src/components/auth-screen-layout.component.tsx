import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDeviceClass } from '../hooks/use-device-class.hook';
import { useAppTheme } from '../theme/use-app-theme.hook';
import { BrandArtworkPanel } from './brand-artwork-panel.component';
import { CloudBackdrop } from './cloud-backdrop.component';
import { SafeScreen } from './safe-screen.component';

/**
 * Visual variants for the auth screens.
 *
 * - `split` renders the tablet split view with the full-bleed cloud painting
 *   on the left and the form on the right. Matches sign-up form and every
 *   wizard step tablet design.
 * - `solo` renders a single centred form card with a small `tappd` wordmark
 *   above the form and NO vivid artwork. Matches the login, forgot-password,
 *   reset-password and OTP tablet designs.
 *
 * Phones always collapse to a single-column form regardless of variant. The
 * wordmark renders inline on phones for both variants.
 */
export type AuthScreenVariant = 'split' | 'solo';

// Design-mandated hardcoded colours for the solo variant (Login / Forgot /
// Reset / OTP). The tablet designs use a deep plum wordmark on the white
// watermark backdrop; no Paper token matches this exactly so we pin it
// here. The pale lavender dot and watermark background are the same.
const SOLO_WORDMARK_DOT = '#C7A4F2';
const SOLO_WORDMARK_INK = '#1E1528';

export interface AuthScreenLayoutProps {
  /**
   * The form / content rendered on the right-hand card. On phone this fills
   * the single column.
   */
  children: ReactNode;
  /**
   * Optional title rendered above the form content. Caller pre-translates.
   */
  title?: string;
  /**
   * Hero copy for the tablet artwork panel. Only consumed by the `split`
   * variant — safe to omit (or pass empty strings) on `solo` screens.
   */
  brandHeadline?: string;
  brandTestimonial?: string;
  brandAttribution?: string;
  /**
   * Visual variant. Defaults to `split`.
   */
  variant?: AuthScreenVariant;
}

/**
 * Responsive layout used by every auth-flow screen.
 *
 * - Tablet `split`: two-column layout with `BrandArtworkPanel` on the left
 *   (full-bleed cloud painting) and a centred form on the right, constrained
 *   to `theme.layout.formMaxWidthTablet` so inputs don't stretch.
 * - Tablet `solo`: single centred card with the `tappd` wordmark above the
 *   form. No vivid artwork.
 * - Phone (both variants): single column with the wordmark inline above the
 *   form. Keyboard avoided.
 */
export function AuthScreenLayout({
  children,
  title,
  brandHeadline,
  brandTestimonial,
  brandAttribution,
  variant = 'split',
}: AuthScreenLayoutProps) {
  const theme = useAppTheme();
  const { deviceClass } = useDeviceClass();
  const isTablet = deviceClass !== 'phone';

  const wordmark = (
    <View style={styles.wordmarkRow}>
      <Text variant="headlineMedium" style={[styles.wordmarkText, { color: SOLO_WORDMARK_INK }]}>
        tappd
      </Text>
      <View
        style={[
          styles.wordmarkDot,
          { backgroundColor: SOLO_WORDMARK_DOT, marginLeft: theme.spacing.xs },
        ]}
      />
    </View>
  );

  const formBody = (
    <>
      {title ? (
        <Text
          variant="headlineSmall"
          style={[
            styles.title,
            {
              color: theme.colors.onSurface,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </>
  );

  if (isTablet && variant === 'split') {
    return (
      <SafeScreen noPadding edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.tabletRow}>
            <View style={styles.tabletBrandColumn}>
              <BrandArtworkPanel
                headline={brandHeadline ?? ''}
                testimonial={brandTestimonial ?? ''}
                attribution={brandAttribution ?? ''}
              />
            </View>
            <View style={[styles.tabletFormColumn, { backgroundColor: theme.colors.surface }]}>
              <ScrollView
                style={styles.flex}
                contentContainerStyle={[
                  styles.splitFormScroll,
                  {
                    maxWidth: theme.layout.formMaxWidthTablet,
                    padding: theme.spacing.lg,
                  },
                ]}
                keyboardShouldPersistTaps="handled"
              >
                {formBody}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeScreen>
    );
  }

  if (isTablet && variant === 'solo') {
    return (
      <SafeScreen noPadding backgroundToken="surface" edges={['top', 'left', 'right']}>
        <CloudBackdrop variant="watermark">
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[styles.soloWordmarkRow, { padding: theme.spacing.lg }]}>{wordmark}</View>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.soloScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={[
                  styles.soloCard,
                  {
                    maxWidth: theme.layout.authCardMaxWidthTablet,
                    padding: theme.spacing.xl,
                  },
                ]}
              >
                <View style={[styles.soloFormInner, { maxWidth: theme.layout.formMaxWidthTablet }]}>
                  {formBody}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </CloudBackdrop>
      </SafeScreen>
    );
  }

  // Phone `split` (registration flow) — plain white background, no clouds.
  if (variant === 'split') {
    return (
      <SafeScreen noPadding backgroundToken="surface" edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={[styles.flex, { backgroundColor: theme.colors.surface }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.phoneScroll,
              {
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.lg,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {wordmark}
            {formBody}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    );
  }

  // Phone `solo` (login, forgot password, reset password, OTP) — keeps the
  // cloud watermark backdrop.
  return (
    <SafeScreen noPadding backgroundToken="surface" edges={['top', 'left', 'right']}>
      <CloudBackdrop variant="watermark">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.phoneScroll,
              {
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.lg,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {wordmark}
            {formBody}
          </ScrollView>
        </KeyboardAvoidingView>
      </CloudBackdrop>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { textAlign: 'center', fontWeight: '700' },
  tabletRow: { flex: 1, flexDirection: 'row' },
  tabletBrandColumn: { flex: 1 },
  tabletFormColumn: { flex: 1 },
  splitFormScroll: {
    flexGrow: 1,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  soloScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soloWordmarkRow: { alignSelf: 'flex-start' },
  soloCard: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  soloFormInner: {
    width: '100%',
    alignSelf: 'center',
  },
  phoneScroll: { flexGrow: 1, justifyContent: 'flex-start' },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmarkText: { fontWeight: '800', letterSpacing: -0.5 },
  wordmarkDot: { width: 10, height: 10, borderRadius: 5 },
});
