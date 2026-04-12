import { AppMenu, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { HelperText, Text, TextInput, TouchableRipple } from 'react-native-paper';

export const PHONE_COUNTRY_CODES: readonly {
  code: string;
  dialCode: string;
  flag: string;
}[] = [
  { code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸' },
];

export interface PhoneInputProps {
  label: string;
  placeholder: string;
  countryCode: string;
  nationalNumber: string;
  onChangeCountryCode: (code: string) => void;
  onChangeNationalNumber: (value: string) => void;
  error?: string;
}

export function PhoneInput({
  label,
  placeholder,
  countryCode,
  nationalNumber,
  onChangeCountryCode,
  onChangeNationalNumber,
  error,
}: PhoneInputProps) {
  const theme = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchorWidth, setAnchorWidth] = useState(0);
  const selected =
    PHONE_COUNTRY_CODES.find((c) => c.code === countryCode) ?? PHONE_COUNTRY_CODES[0];

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
      <View style={styles.row}>
        <AppMenu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchorPosition="bottom"
          contentStyle={anchorWidth > 0 ? { width: anchorWidth } : undefined}
          anchor={
            <TouchableRipple onPress={() => setMenuVisible(true)} style={styles.prefixRipple}>
              <View pointerEvents="none" onLayout={onAnchorLayout}>
                <TextInput
                  mode="outlined"
                  value={selected ? `${selected.flag} ${selected.dialCode}` : ''}
                  editable={false}
                  right={<TextInput.Icon icon="menu-down" />}
                />
              </View>
            </TouchableRipple>
          }
        >
          {PHONE_COUNTRY_CODES.map((country) => (
            <AppMenu.Item
              key={country.code}
              onPress={() => {
                onChangeCountryCode(country.code);
                setMenuVisible(false);
              }}
              title={`${country.flag} ${country.dialCode}`}
            />
          ))}
        </AppMenu>
        <View style={[styles.nationalNumber, { marginLeft: theme.spacing.sm }]}>
          <TextInput
            mode="outlined"
            placeholder={placeholder}
            value={nationalNumber}
            onChangeText={onChangeNationalNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
            error={Boolean(error)}
          />
        </View>
      </View>
      <HelperText type="error" visible={Boolean(error)}>
        {error ?? ' '}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  prefixRipple: { flex: 1, maxWidth: 140 },
  nationalNumber: { flex: 2 },
});
