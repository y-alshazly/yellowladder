import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useAppTheme } from '../theme/use-app-theme.hook';

export interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  /**
   * Placeholder text for the search input. Callers must pass a localized
   * string — the component is domain-agnostic and has no default copy.
   */
  placeholder?: string;
}

/**
 * Outlined Paper TextInput with magnify + clear icons. Generic search input;
 * callers supply their own i18n placeholder so this component can be reused
 * across any feature.
 */
export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const theme = useAppTheme();

  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
      <TextInput
        mode="outlined"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        left={<TextInput.Icon icon="magnify" />}
        right={value ? <TextInput.Icon icon="close" onPress={() => onChange('')} /> : undefined}
        dense
      />
    </View>
  );
}
