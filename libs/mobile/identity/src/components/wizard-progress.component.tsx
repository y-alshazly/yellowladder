import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export interface WizardProgressProps {
  /**
   * 1-indexed current step shown as active.
   */
  currentStep: number;
  /**
   * Total number of steps in this wizard branch (3 for self-employed and
   * limited-company per architect §1.4 canonical interpretation).
   */
  totalSteps: number;
}

/**
 * Rounded-pill wizard step indicator matching the Feature 01 designs. The
 * active step is filled with the theme primary; prior completed steps are
 * rendered in the darker lavender; upcoming steps in the surface variant.
 */
export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const theme = useAppTheme();
  const pills = Array.from({ length: totalSteps }, (_, index) => index + 1);
  return (
    <View
      accessibilityRole="progressbar"
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          paddingHorizontal: theme.spacing.xs,
          paddingVertical: theme.spacing.xs,
          borderRadius: 999,
        },
      ]}
    >
      {pills.map((step) => {
        const isCompleted = step <= currentStep;
        const backgroundColor = isCompleted ? theme.colors.secondary : theme.colors.surfaceVariant;
        const labelColor = isCompleted ? theme.colors.onSecondary : theme.colors.onSurfaceVariant;
        return (
          <View
            key={step}
            style={[
              styles.pill,
              {
                backgroundColor,
                marginHorizontal: theme.spacing.xs,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
              },
            ]}
          >
            <Text variant="labelLarge" style={{ color: labelColor }}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    alignSelf: 'center',
    alignItems: 'center',
  },
  pill: { minWidth: 36, alignItems: 'center', borderRadius: 999 },
});
