import type { ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';
import { de, en, fr, registerTranslation } from 'react-native-paper-dates';
import { yellowladderPaperTheme } from '../theme/yellowladder-paper.theme';

// Register date-picker translations for all supported locales.
// Must run before any DatePickerModal renders.
registerTranslation('en', en);
registerTranslation('de', de);
registerTranslation('fr', fr);

export interface PaperThemeProviderProps {
  children: ReactNode;
}

/**
 * Thin wrapper around Paper's `PaperProvider` that injects the Yellow Ladder
 * theme. The app shell should mount exactly one of these at the root.
 */
export function PaperThemeProvider({ children }: PaperThemeProviderProps) {
  return <PaperProvider theme={yellowladderPaperTheme}>{children}</PaperProvider>;
}
