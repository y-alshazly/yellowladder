import { useState } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import { useAppTheme } from '../theme/use-app-theme.hook';

export interface FormTextFieldProps<T extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'theme'
> {
  /** react-hook-form control object. */
  control: Control<T>;
  /** Field name registered in the form. */
  name: FieldPath<T>;
  /**
   * Standalone label rendered **above** the text input. Automatically turns
   * error-coloured when the field has a validation error.
   */
  label?: string;
  /**
   * Material Community Icon name rendered on the left side of the input.
   * Pass `undefined` / omit to hide.
   */
  leftIcon?: string;
  /**
   * Material Community Icon name rendered on the right side of the input.
   * Ignored when `secureTextEntry` is `true` (the eye toggle takes priority).
   */
  rightIcon?: string;
  /** Callback when the right icon is pressed. Ignored for password fields. */
  onRightIconPress?: () => void;
  /**
   * Already-translated error string to display. When omitted the component
   * falls back to the `message` property on the field error from
   * react-hook-form, which it passes through `t()` (Yellow Ladder Zod
   * schemas store i18n keys as error messages).
   */
  errorMessage?: string;
  /**
   * Optional callback invoked with the new text value whenever the field
   * changes. Useful for side-effects like debounced search — the form
   * state is always updated first via the Controller binding.
   */
  onChangeValue?: (text: string) => void;
  /** Override the wrapper View style (e.g. spacing). */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Reusable form text field that wires react-hook-form `Controller` to a
 * React Native Paper `TextInput` + `HelperText` error row.
 *
 * Handles the password-visibility eye toggle automatically when
 * `secureTextEntry` is passed.
 *
 * Error messages from Zod schemas are i18n keys (`validation.emailRequired`
 * etc.) and are automatically translated via `t()`.
 *
 * Usage:
 * ```tsx
 * <FormTextField control={control} name="email" leftIcon="email-outline"
 *   placeholder={t('auth.login.emailPlaceholder')}
 *   keyboardType="email-address" autoCapitalize="none" />
 * ```
 */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  errorMessage,
  onChangeValue,
  containerStyle,
  secureTextEntry,
  ...textInputProps
}: FormTextFieldProps<T>) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [secureVisible, setSecureVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={[{ marginBottom: theme.spacing.sm }, containerStyle]}>
          {label ? (
            <Text
              style={{
                color: error ? theme.colors.error : theme.colors.onSurface,
                fontSize: 14,
                fontWeight: '500',
                marginBottom: 4,
              }}
            >
              {label}
            </Text>
          ) : null}
          <TextInput
            mode="outlined"
            value={value ?? ''}
            onChangeText={(text: string) => {
              onChange(text);
              onChangeValue?.(text);
            }}
            onBlur={onBlur}
            secureTextEntry={isPassword ? !secureVisible : undefined}
            left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
            right={
              isPassword ? (
                <TextInput.Icon
                  icon={secureVisible ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setSecureVisible((v) => !v)}
                />
              ) : rightIcon ? (
                <TextInput.Icon icon={rightIcon} onPress={onRightIconPress} />
              ) : undefined
            }
            error={Boolean(error)}
            {...textInputProps}
          />
          {error ? (
            <HelperText type="error" visible>
              {errorMessage ?? t(error.message ?? '')}
            </HelperText>
          ) : null}
        </View>
      )}
    />
  );
}
