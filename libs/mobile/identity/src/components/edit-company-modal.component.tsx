import { useAppTheme, useDeviceClass } from '@yellowladder/shared-mobile-ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface EditCompanyFormValues {
  name: string;
  address: string;
}

export interface EditCompanyModalProps {
  visible: boolean;
  initialName: string;
  initialAddress: string;
  onDismiss: () => void;
  onSave: (values: EditCompanyFormValues) => void;
}

export function EditCompanyModal({
  visible,
  initialName,
  initialAddress,
  onDismiss,
  onSave,
}: EditCompanyModalProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { deviceClass } = useDeviceClass();
  const isPhone = deviceClass === 'phone';

  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setAddress(initialAddress);
    }
  }, [visible, initialName, initialAddress]);

  const handleSave = (): void => {
    onSave({ name, address });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        style={{ justifyContent: 'center', alignItems: 'center' }}
        contentContainerStyle={{
          backgroundColor: 'white',
          padding: 24,
          borderRadius: 16,
          width: isPhone ? '92%' : 520,
        }}
      >
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.title}>
            {t('wizard.connectBusiness.editCompany.title')}
          </Text>
          <IconButton
            icon="close"
            accessibilityLabel={t('common.close')}
            onPress={onDismiss}
            mode="outlined"
            size={18}
            style={styles.closeButton}
          />
        </View>

        <View style={styles.warningBox}>
          <Icon name="information-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8, flex: 1 }}
          >
            {t('wizard.connectBusiness.editCompany.warning')}
          </Text>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
            {t('wizard.connectBusiness.editCompany.nameLabel')}
          </Text>
          <TextInput mode="outlined" value={name} onChangeText={setName} />
        </View>

        <View style={{ marginTop: 16 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
            {t('wizard.connectBusiness.editCompany.addressLabel')}
          </Text>
          <TextInput mode="outlined" value={address} onChangeText={setAddress} />
        </View>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {t('wizard.connectBusiness.editCompany.save')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontWeight: '800', flex: 1 },
  closeButton: {
    borderColor: '#D7D7D8',
    borderWidth: 1,
    borderRadius: 999,
    margin: -8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7D7D8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 20,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 48,
  },
  saveButton: { borderRadius: 8, minWidth: 180 },
  saveButtonContent: { paddingVertical: 8 },
});
