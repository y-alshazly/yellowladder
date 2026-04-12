import { useNavigation } from '@react-navigation/native';
import {
  CloudBackdrop,
  HandsOverlay,
  SafeScreen,
  useAppTheme,
  useDeviceClass,
} from '@yellowladder/shared-mobile-ui';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';

// Design-mandated hardcoded colours for the cloud-backdrop screens. Same
// rationale as splash.screen.tsx — the cloud painting is photographic and
// the Paper theme has no "always-white-on-art" token.
const BRAND_ON_ARTWORK = '#FFFFFF';
const BRAND_WORDMARK_DOT = '#C7A4F2';

/**
 * Welcome screen — rendered directly after the Splash animation completes.
 * On tablet the hands are in their final "close together" pose (matching
 * the tail of the splash animation); on phone the design degrades to a
 * single-column stack. Two CTAs at the bottom route into the create-account
 * or log-in branches of the rest of the auth stack.
 */
export function WelcomeScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const { deviceClass } = useDeviceClass();
  const isPhone = deviceClass === 'phone';

  return (
    <SafeScreen noPadding edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <CloudBackdrop variant="hero">
          <HandsOverlay verticalAnchor={isPhone ? 0.15 : 0.24} />
          <View style={styles.overlay}>
            <View style={[styles.topBar, { padding: theme.spacing.xl }]}>
              <View style={styles.wordmarkRow}>
                <Text
                  variant="headlineMedium"
                  style={[styles.wordmark, { color: BRAND_ON_ARTWORK }]}
                >
                  tappd
                </Text>
                <View
                  style={[
                    styles.wordmarkDot,
                    {
                      backgroundColor: BRAND_WORDMARK_DOT,
                      marginLeft: theme.spacing.xs,
                    },
                  ]}
                />
              </View>
              {isPhone ? null : (
                <Text style={[styles.headline, { color: BRAND_ON_ARTWORK }]}>
                  {t('common.brand.headline')}
                </Text>
              )}
            </View>
            <View style={[styles.centerBlock, { padding: theme.spacing.xl }]}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('SignupAccount')}
                style={[styles.pillButton, { marginBottom: theme.spacing.md }]}
                contentStyle={styles.pillButtonContent}
              >
                {t('auth.welcome.createAccount')}
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Login')}
                style={[
                  styles.pillButton,
                  {
                    borderColor: '#000000',
                    borderWidth: 1,
                  },
                ]}
                contentStyle={styles.pillButtonContent}
                textColor="#000000"
              >
                {t('auth.welcome.logIn')}
              </Button>
            </View>
          </View>
        </CloudBackdrop>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  overlay: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontWeight: '800', letterSpacing: -0.5 },
  wordmarkDot: { width: 10, height: 10, borderRadius: 5 },
  headline: { fontWeight: '900', fontSize: 28, textAlign: 'right' },
  centerBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pillButton: {
    alignSelf: 'center',
    minWidth: 280,
    borderRadius: 8,
  },
  pillButtonContent: { paddingVertical: 8 },
});
