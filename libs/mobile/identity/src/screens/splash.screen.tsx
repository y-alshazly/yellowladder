import { useNavigation } from '@react-navigation/native';
import { SUPPORTED_LOCALE_LIST, type SupportedLocale } from '@yellowladder/shared-i18n';
import {
  AppMenu,
  CloudBackdrop,
  HandsOverlay,
  SafeScreen,
  useAppTheme,
  useDeviceClass,
} from '@yellowladder/shared-mobile-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TouchableRipple } from 'react-native-paper';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';

// Design-mandated hardcoded colours for the splash screen. Same rationale
// as the other cloud-backdrop screens: the cloud painting is a photographic
// background and the Paper theme has no "always-white-on-art" token.
const BRAND_ON_ARTWORK = '#FFFFFF';
const BRAND_WORDMARK_DOT = '#C7A4F2';
const LANGUAGE_DROPDOWN_BG = '#1E1A26';
// Overlay that darkens the splash until the user taps Continue. Fades to
// `0` as the hands animation progresses.
const SPLASH_SCRIM_ALPHA = 0.25;

// Animation timings per legacy `1-splash-screen.tsx` — proven feel.
const HANDS_DELAY_MS = 300;
const HANDS_DURATION_MS = 2200;
const NAVIGATE_DELAY_MS = 2500;

interface LocaleOption {
  code: SupportedLocale;
  label: string;
  flag: string;
}

const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

/**
 * Splash screen — the very first screen on cold launch. Shows the vivid
 * cloud painting with the `tappd` wordmark, the `CALM THE CHAOS.` headline,
 * a dark language picker and a lavender Continue button. When the user taps
 * Continue the two hand sprites slide in from off-screen, scale up to their
 * final pose, and the screen then navigates to the Welcome screen with a
 * fade transition. The hands' final pose matches the Welcome screen so the
 * visual continues seamlessly.
 */
export function SplashScreen() {
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const { deviceClass, width: screenWidth } = useDeviceClass();
  const currentCode = (i18n.language?.slice(0, 2) ?? 'en') as SupportedLocale;
  const initialSelection =
    LOCALE_OPTIONS.find((opt) => opt.code === currentCode) ??
    LOCALE_OPTIONS[0] ??
    ({ code: 'en', label: 'English', flag: '🇬🇧' } as LocaleOption);
  const [selected, setSelected] = useState<LocaleOption>(initialSelection);
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchorWidth, setAnchorWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Silence unused-import lint when the locale list isn't referenced.
  void SUPPORTED_LOCALE_LIST;

  const handsProgress = useSharedValue(0);
  const SLIDE_DIST = screenWidth * 0.2;

  const leftHandStyle = useAnimatedStyle(() => ({
    opacity: interpolate(handsProgress.value, [0, 0.1, 1], [0.7, 1.0, 1.0]),
    transform: [
      { translateX: interpolate(handsProgress.value, [0, 1], [-SLIDE_DIST, 0]) },
      { scale: interpolate(handsProgress.value, [0, 1], [0.65, 1.0]) },
    ],
  }));

  const rightHandStyle = useAnimatedStyle(() => ({
    opacity: interpolate(handsProgress.value, [0, 0.1, 1], [0.7, 1.0, 1.0]),
    transform: [
      { translateX: interpolate(handsProgress.value, [0, 1], [SLIDE_DIST, 0]) },
      { scale: interpolate(handsProgress.value, [0, 1], [0.65, 1.0]) },
    ],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(handsProgress.value, [0, 1], [SPLASH_SCRIM_ALPHA, 0]),
  }));

  const uiOverlayStyle = useAnimatedStyle(() => ({
    // Fade the language picker out as the animation plays so it doesn't
    // compete with the moving hands.
    opacity: interpolate(handsProgress.value, [0, 0.3, 1], [1, 0.3, 0]),
  }));

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleContinue = useCallback(async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    if (i18n.language !== selected.code) {
      await i18n.changeLanguage(selected.code);
    }
    handsProgress.value = withDelay(
      HANDS_DELAY_MS,
      withTiming(1, {
        duration: HANDS_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
    timerRef.current = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }, NAVIGATE_DELAY_MS);
  }, [busy, handsProgress, i18n, navigation, selected]);

  return (
    <SafeScreen noPadding edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <CloudBackdrop variant="hero">
          <HandsOverlay
            leftHandStyle={leftHandStyle}
            rightHandStyle={rightHandStyle}
            verticalAnchor={0.36}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.scrim, { backgroundColor: '#000000' }, scrimStyle]}
          />
          <Animated.View style={[styles.overlay, uiOverlayStyle]}>
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
              {deviceClass !== 'phone' && (
                <Text style={[styles.headline, { color: BRAND_ON_ARTWORK }]}>
                  {t('common.brand.headline')}
                </Text>
              )}
            </View>
            <View style={[styles.centerBlock, { padding: theme.spacing.xl }]}>
              <Text
                variant="labelLarge"
                style={[styles.label, { color: BRAND_ON_ARTWORK, marginBottom: theme.spacing.sm }]}
              >
                {t('auth.start.selectLanguage')}
              </Text>
              <AppMenu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchorPosition="bottom"
                contentStyle={anchorWidth > 0 ? { width: anchorWidth } : undefined}
                anchor={
                  <TouchableRipple
                    accessibilityRole="button"
                    onPress={() => setMenuVisible(true)}
                    onLayout={(e) => setAnchorWidth(e.nativeEvent.layout.width)}
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: LANGUAGE_DROPDOWN_BG,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.sm,
                      },
                    ]}
                  >
                    <View style={styles.dropdownInner}>
                      <Text
                        variant="bodyLarge"
                        style={[styles.dropdownText, { color: BRAND_ON_ARTWORK }]}
                      >
                        {selected.flag} {selected.label}
                      </Text>
                      <Text
                        variant="bodyLarge"
                        style={[styles.dropdownCaret, { color: BRAND_ON_ARTWORK }]}
                      >
                        ▾
                      </Text>
                    </View>
                  </TouchableRipple>
                }
              >
                {LOCALE_OPTIONS.map((option) => (
                  <AppMenu.Item
                    key={option.code}
                    onPress={() => {
                      setSelected(option);
                      setMenuVisible(false);
                    }}
                    title={`${option.flag}  ${option.label}`}
                  />
                ))}
              </AppMenu>
              <Button
                mode="contained"
                onPress={handleContinue}
                disabled={busy}
                style={[styles.continueButton, { marginTop: theme.spacing.md }]}
                contentStyle={styles.continueButtonContent}
              >
                {t('auth.start.continue')}
              </Button>
            </View>
          </Animated.View>
        </CloudBackdrop>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  overlay: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject },
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
  label: { textAlign: 'center' },
  dropdown: {
    alignSelf: 'center',
    borderRadius: 8,
    minWidth: 240,
  },
  dropdownInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontWeight: '600' },
  dropdownCaret: { fontWeight: '700' },
  continueButton: {
    alignSelf: 'center',
    minWidth: 240,
    borderRadius: 8,
  },
  continueButtonContent: { paddingVertical: 8 },
});
