import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/use-app-theme.hook';

export interface SafeScreenProps {
  children: ReactNode;
  edges?: readonly Edge[];
  /**
   * Background colour token from the theme. Defaults to `background`.
   */
  backgroundToken?: 'background' | 'surface' | 'surfaceVariant' | 'primaryContainer';
  /**
   * When true, removes the default horizontal padding. Useful for screens
   * that draw their own full-bleed layouts (e.g. auth split view).
   */
  noPadding?: boolean;
  style?: ViewStyle;
}

const DEFAULT_EDGES: readonly Edge[] = ['top', 'bottom', 'left', 'right'];

/**
 * Universal safe-area wrapper every screen must render as its root. Handles
 * notches, Dynamic Island, Android system bars, and applies the themed
 * background.
 */
export function SafeScreen({
  children,
  edges = DEFAULT_EDGES,
  backgroundToken = 'background',
  noPadding = false,
  style,
}: SafeScreenProps) {
  const theme = useAppTheme();
  const backgroundColor = theme.colors[backgroundToken];
  return (
    <SafeAreaView edges={edges.slice()} style={[styles.root, { backgroundColor }]}>
      <View style={[styles.inner, !noPadding && { paddingHorizontal: theme.spacing.lg }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
});
