import { AppMenu, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { HelperText, Text, TextInput, TouchableRipple } from 'react-native-paper';

export const COUNTRY_OPTIONS: readonly { code: string; label: string; flag: string }[] = [
  { code: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IE', label: 'Ireland', flag: '🇮🇪' },
  { code: 'DE', label: 'Germany', flag: '🇩🇪' },
  { code: 'FR', label: 'France', flag: '🇫🇷' },
  { code: 'ES', label: 'Spain', flag: '🇪🇸' },
  { code: 'IT', label: 'Italy', flag: '🇮🇹' },
  { code: 'NL', label: 'Netherlands', flag: '🇳🇱' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
];

export interface CountryDropdownProps {
  label: string;
  placeholder: string;
  value: string | null;
  onChange: (countryCode: string) => void;
  error?: string;
}

export function CountryDropdown({
  label,
  placeholder,
  value,
  onChange,
  error,
}: CountryDropdownProps) {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [anchorWidth, setAnchorWidth] = useState(0);
  const selected = value ? (COUNTRY_OPTIONS.find((c) => c.code === value) ?? null) : null;

  const onAnchorLayout = (e: LayoutChangeEvent) => {
    setAnchorWidth(e.nativeEvent.layout.width);
  };

  return (
    <View>
      <Text
        variant="labelLarge"
        style={{ color: error ? theme.colors.error : theme.colors.onSurface, marginBottom: 4 }}
      >
        {label}
      </Text>
      <AppMenu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchorPosition="bottom"
        contentStyle={anchorWidth > 0 ? { width: anchorWidth } : undefined}
        anchor={
          <TouchableRipple onPress={() => setVisible(true)}>
            <View pointerEvents="none" onLayout={onAnchorLayout}>
              <TextInput
                mode="outlined"
                placeholder={placeholder}
                value={selected ? `${selected.flag} ${selected.label}` : ''}
                editable={false}
                right={<TextInput.Icon icon="menu-down" />}
                left={<TextInput.Icon icon="earth" />}
                error={Boolean(error)}
              />
            </View>
          </TouchableRipple>
        }
      >
        {COUNTRY_OPTIONS.map((country) => (
          <AppMenu.Item
            key={country.code}
            onPress={() => {
              onChange(country.code);
              setVisible(false);
            }}
            title={`${country.flag} ${country.label}`}
          />
        ))}
      </AppMenu>
      <HelperText type="error" visible={Boolean(error)}>
        {error ?? ' '}
      </HelperText>
    </View>
  );
}

const _unusedStyles = StyleSheet.create({});
void _unusedStyles;
