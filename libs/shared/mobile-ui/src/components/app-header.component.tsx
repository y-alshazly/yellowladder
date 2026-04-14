import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useAppTheme } from '../theme/use-app-theme.hook';

export interface AppHeaderProps {
  title: string;
  /** Optional content rendered on the right (e.g. a primary action button). */
  rightAction?: ReactNode;
  style?: ViewStyle;
}

const MENU_BUTTON_BG = '#141414';
const MENU_BUTTON_SIZE = 40;

/**
 * Top-of-screen header with a circular drawer-toggle button on the left,
 * a title, and an optional right-side action slot. Screens render this
 * at the top of their content instead of defining their own header rows.
 */
export function AppHeader({ title, rightAction, style }: AppHeaderProps) {
  const theme = useAppTheme();
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        },
        style,
      ]}
    >
      <Pressable
        onPress={openDrawer}
        accessibilityRole="button"
        accessibilityLabel="Open navigation"
        style={({ pressed }) => [
          styles.menuButton,
          { backgroundColor: MENU_BUTTON_BG, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Icon source="menu" size={22} color="#FFFFFF" />
      </Pressable>

      <Text
        variant="titleMedium"
        style={[styles.title, { color: theme.colors.onBackground, marginLeft: theme.spacing.md }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.rightSlot}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: MENU_BUTTON_SIZE,
    height: MENU_BUTTON_SIZE,
    borderRadius: MENU_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  rightSlot: {
    marginLeft: 8,
  },
});
