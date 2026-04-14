import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { createRef, useMemo, useRef } from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { HelperText } from 'react-native-paper';

export interface OtpCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
}

/**
 * 6-cell code input matching the verify-email design. Cells flex evenly
 * across the available width and centre the digit both horizontally and
 * vertically. Auto-advances on input; backspace returns to the previous
 * cell.
 */
export function OtpCodeInput({
  length = 6,
  value,
  onChange,
  error,
  autoFocus = true,
}: OtpCodeInputProps) {
  const theme = useAppTheme();
  const refs = useMemo(() => Array.from({ length }, () => createRef<RNTextInput>()), [length]);
  const lastValueRef = useRef(value);
  lastValueRef.current = value;

  const setAt = (index: number, digit: string): void => {
    const next = lastValueRef.current.padEnd(length, ' ').split('');
    next[index] = digit;
    const joined = next.join('').replace(/\s/g, '');
    onChange(joined.slice(0, length));
  };

  const handleChange = (index: number, input: string): void => {
    const digit = input.replace(/\D/g, '').slice(-1);
    if (!digit) {
      setAt(index, '');
      return;
    }
    setAt(index, digit);
    if (index < length - 1) {
      refs[index + 1]?.current?.focus();
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ): void => {
    if (event.nativeEvent.key !== 'Backspace') return;
    if (value[index]) return;
    if (index > 0) {
      refs[index - 1]?.current?.focus();
    }
  };

  const cells = Array.from({ length }, (_, index) => value[index] ?? '');
  const borderColor = error ? theme.colors.error : '#D7D7D8';

  return (
    <View>
      <View style={styles.row}>
        {cells.map((cell, index) => (
          <RNTextInput
            key={index}
            ref={refs[index]}
            value={cell}
            onChangeText={(text) => handleChange(index, text)}
            onKeyPress={(event) => handleKeyPress(index, event)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={autoFocus && index === 0}
            selectionColor={theme.colors.primary}
            style={[
              styles.cell,
              {
                borderColor,
                color: theme.colors.onSurface,
              },
            ]}
          />
        ))}
      </View>
      <HelperText type="error" visible={Boolean(error)}>
        {error ?? ' '}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
  },
  cell: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 22,
    fontWeight: '600',
    padding: 0,
  },
});
