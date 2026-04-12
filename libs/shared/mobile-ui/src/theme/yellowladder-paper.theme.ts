import { MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';

/**
 * Yellow Ladder mobile theme — lavender primary per the Feature 01 sign-up
 * designs. Every screen MUST consume tokens from this theme via `useTheme()`.
 * Never hardcode colours or pixel values in screens.
 */

const brandColors = {
  lavender100: '#F2ECFB',
  lavender300: '#D6C4F2',
  lavender500: '#C9B6EB',
  lavender700: '#7A5FBF',
  lavender900: '#3C2868',
  ink900: '#0E0B14',
  ink700: '#2A2433',
  ink500: '#524A5E',
  ink400: '#736B80',
  neutral200: '#F5F4F7',
  neutral100: '#FAFAFC',
  neutral50: '#FFFFFF',
  danger500: '#C93636',
  success500: '#2E8A3F',
  warning500: '#C48416',
} as const;

const fontConfig = {
  bodyLarge: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
    fontSize: 14,
  },
  titleLarge: {
    fontFamily: 'System',
    fontWeight: '700' as const,
    letterSpacing: 0,
    lineHeight: 30,
    fontSize: 24,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontWeight: '700' as const,
    letterSpacing: 0,
    lineHeight: 36,
    fontSize: 28,
  },
};

export const yellowladderPaperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 5,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.lavender500,
    onPrimary: brandColors.ink900,
    primaryContainer: brandColors.lavender100,
    onPrimaryContainer: brandColors.lavender900,
    secondary: brandColors.lavender700,
    onSecondary: brandColors.neutral50,
    secondaryContainer: brandColors.lavender100,
    onSecondaryContainer: brandColors.lavender900,
    tertiary: brandColors.lavender300,
    onTertiary: brandColors.ink900,
    tertiaryContainer: brandColors.lavender100,
    onTertiaryContainer: brandColors.lavender900,
    error: brandColors.danger500,
    onError: brandColors.neutral50,
    errorContainer: '#FBEAEA',
    onErrorContainer: brandColors.danger500,
    background: brandColors.neutral100,
    onBackground: brandColors.ink900,
    surface: brandColors.neutral50,
    onSurface: brandColors.ink900,
    surfaceVariant: brandColors.neutral200,
    onSurfaceVariant: brandColors.ink500,
    outline: '#D7D7D8',
    outlineVariant: '#E4E1EA',
    inverseSurface: brandColors.ink900,
    inverseOnSurface: brandColors.neutral100,
    inversePrimary: brandColors.lavender300,
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(14, 11, 20, 0.4)',
  },
  fonts: configureFonts({ config: fontConfig }),
};

/**
 * Custom spacing + layout tokens that extend the Paper theme. Access via
 * `const { spacing } = useAppTheme()` so screens never hardcode magic numbers.
 */
export const yellowladderSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const yellowladderLayout = {
  formMaxWidthTablet: 480,
  authCardMaxWidthTablet: 980,
  phoneSingleColumnMaxWidth: 560,
  inputHeight: 55,
} as const;

export type YellowladderSpacing = typeof yellowladderSpacing;
export type YellowladderLayout = typeof yellowladderLayout;
