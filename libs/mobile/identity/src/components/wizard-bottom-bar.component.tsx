import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, TouchableRipple } from 'react-native-paper';
import { WizardProgress } from './wizard-progress.component';

export interface WizardBottomBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onForward: () => void;
  forwardDisabled?: boolean;
  backDisabled?: boolean;
}

/**
 * The "Go Back | {progress dots} | →" row pinned to the bottom of every
 * wizard screen. Progress and CTA live in one component so the designs
 * stay consistent across steps.
 */
export function WizardBottomBar({
  currentStep,
  totalSteps,
  onBack,
  onForward,
  forwardDisabled = false,
  backDisabled = false,
}: WizardBottomBarProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.row, { paddingVertical: theme.spacing.md }]}>
      <TouchableRipple
        accessibilityRole="button"
        onPress={onBack}
        disabled={backDisabled || !onBack}
        style={styles.backSlot}
      >
        <Text
          variant="labelLarge"
          style={{
            color: backDisabled || !onBack ? theme.colors.onSurfaceVariant : theme.colors.onSurface,
          }}
        >
          {t('common.goBack')}
        </Text>
      </TouchableRipple>
      <View style={styles.progressSlot}>
        <WizardProgress currentStep={currentStep} totalSteps={totalSteps} />
      </View>
      <View style={styles.forwardSlot}>
        <IconButton
          mode="contained"
          icon="arrow-right"
          onPress={onForward}
          disabled={forwardDisabled}
          iconColor={theme.colors.onPrimary}
          containerColor={theme.colors.primary}
          accessibilityLabel={t('common.next')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backSlot: { flex: 1, alignItems: 'flex-start' },
  progressSlot: { flex: 2, alignItems: 'center' },
  forwardSlot: { flex: 1, alignItems: 'flex-end' },
});
