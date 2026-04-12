import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { createRef, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

export interface OtpCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
}

/**
 * 6-cell code input matching the verify-email design. Auto-advances to
 * the next cell on input and returns to the previous cell on backspace.
 *
 * Uses Paper `TextInput` so focus / error styling follows the theme. Each
 * cell is a single-character `numeric` input — we never attempt to paste
 * a full code because the design shows one cell per digit.
 */
export function OtpCodeInput({
  length = 6,
  value,
  onChange,
  error,
  autoFocus = true,
}: OtpCodeInputProps) {
  const theme = useAppTheme();
  const refs = useMemo(() => Array.from({ length }, () => createRef<never>()), [length]);
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
      const next = refs[index + 1]?.current as unknown as { focus?: () => void } | null;
      next?.focus?.();
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ): void => {
    if (event.nativeEvent.key !== 'Backspace') return;
    if (value[index]) return;
    if (index > 0) {
      const prev = refs[index - 1]?.current as unknown as { focus?: () => void } | null;
      prev?.focus?.();
    }
  };

  const cells = Array.from({ length }, (_, index) => value[index] ?? '');

  return (
    <View>
      <View style={styles.row}>
        {cells.map((cell, index) => (
          <View key={index} style={styles.cellWrapper}>
            <TextInput
              ref={refs[index]}
              mode="outlined"
              value={cell}
              onChangeText={(text) => handleChange(index, text)}
              onKeyPress={(event) => handleKeyPress(index, event)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              autoFocus={autoFocus && index === 0}
              error={Boolean(error)}
              style={styles.cellInput}
              outlineColor="#D7D7D8"
              activeOutlineColor="#D7D7D8"
              outlineStyle={styles.cellOutline}
            />
          </View>
        ))}
      </View>
      <HelperText type="error" visible={Boolean(error)}>
        {error ?? ' '}
      </HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  cellWrapper: { width: 70, height: 100 },
  cellInput: { textAlign: 'center', fontSize: 24, height: 100 },
  cellOutline: { borderWidth: 1, borderRadius: 5 },
});
