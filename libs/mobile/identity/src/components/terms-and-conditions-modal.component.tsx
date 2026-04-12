import { useAppTheme, useDeviceClass } from '@yellowladder/shared-mobile-ui';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';

export interface TermsAndConditionsModalProps {
  visible: boolean;
  onDismiss: () => void;
  onAccept: () => void;
}

export function TermsAndConditionsModal({
  visible,
  onDismiss,
  onAccept,
}: TermsAndConditionsModalProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { deviceClass } = useDeviceClass();
  const isPhone = deviceClass === 'phone';
  const screenHeight = Dimensions.get('window').height;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          {
            backgroundColor: theme.colors.surface,
            padding: theme.spacing.lg,
            maxHeight: isPhone ? screenHeight * 0.85 : screenHeight * 0.7,
            width: isPhone ? '100%' : 520,
          },
        ]}
      >
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('auth.terms.title')}
        </Text>
        <ScrollView
          style={[styles.scroll, { marginTop: theme.spacing.md }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.md }}
          >
            {t('auth.terms.intro')}
          </Text>
          <Text
            variant="titleMedium"
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurface, marginTop: theme.spacing.md },
            ]}
          >
            {t('auth.terms.section.about.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface, marginTop: theme.spacing.xs }}
          >
            {t('auth.terms.section.about.body')}
          </Text>
          <Text
            variant="titleMedium"
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurface, marginTop: theme.spacing.md },
            ]}
          >
            {t('auth.terms.section.eligibility.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurface, marginTop: theme.spacing.xs }}
          >
            {t('auth.terms.section.eligibility.body')}
          </Text>
        </ScrollView>
        <View style={[styles.footer, { marginTop: theme.spacing.lg }]}>
          <Button
            mode="contained"
            onPress={onAccept}
            style={styles.acceptButton}
            contentStyle={styles.acceptButtonContent}
          >
            {t('auth.terms.iAccept')}
          </Button>
          <Text
            variant="bodySmall"
            style={[
              styles.helper,
              { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm },
            ]}
          >
            {t('auth.terms.helper')}
          </Text>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    borderRadius: 20,
    alignSelf: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: { textAlign: 'center', fontWeight: '800' },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 8 },
  sectionTitle: { fontWeight: '700' },
  footer: { alignItems: 'center' },
  acceptButton: { borderRadius: 8, alignSelf: 'stretch' },
  acceptButtonContent: { paddingVertical: 8 },
  helper: { fontStyle: 'italic', textAlign: 'center' },
});
