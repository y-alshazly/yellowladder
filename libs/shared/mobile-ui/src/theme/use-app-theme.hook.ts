import type { MD3Theme } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { yellowladderLayout, yellowladderSpacing } from './yellowladder-paper.theme';

export interface AppTheme extends MD3Theme {
  spacing: typeof yellowladderSpacing;
  layout: typeof yellowladderLayout;
}

/**
 * Typed Paper theme accessor with Yellow Ladder custom tokens merged on.
 * Use in every screen instead of calling `useTheme()` directly so that the
 * `spacing` and `layout` tokens are always available.
 */
export function useAppTheme(): AppTheme {
  const paperTheme = useTheme();
  return {
    ...paperTheme,
    spacing: yellowladderSpacing,
    layout: yellowladderLayout,
  };
}
