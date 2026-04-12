import { type ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Menu } from 'react-native-paper';

export type AppMenuProps = ComponentProps<typeof Menu>;

/**
 * Project-wide Menu wrapper that applies the Yellow Ladder dropdown style:
 * white background, rounded corners, and consistent padding.
 * Use this instead of importing `Menu` from react-native-paper directly.
 */
export function AppMenu({ contentStyle, style, ...rest }: AppMenuProps) {
  return (
    <Menu contentStyle={[styles.content, contentStyle]} style={[styles.menu, style]} {...rest} />
  );
}

/** Re-export Menu.Item so consumers don't need a separate Paper import. */
AppMenu.Item = Menu.Item;

const styles = StyleSheet.create({
  menu: {
    marginTop: 4,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
  },
});
