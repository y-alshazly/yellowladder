import { useAppTheme, useDeviceClass } from '@yellowladder/shared-mobile-ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
} from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';

export interface NewContactFormValues {
  firstName: string;
  lastName: string;
  jobPosition: string;
  dateOfBirth: string;
  address: string;
}

export interface NewContactModalProps {
  visible: boolean;
  onDismiss: () => void;
  onCreate: (values: NewContactFormValues) => void;
}

const EMPTY_VALUES: NewContactFormValues = {
  firstName: '',
  lastName: '',
  jobPosition: '',
  dateOfBirth: '',
  address: '',
};

export function NewContactModal({ visible, onDismiss, onCreate }: NewContactModalProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { deviceClass } = useDeviceClass();
  const isPhone = deviceClass === 'phone';

  const [values, setValues] = useState<NewContactFormValues>(EMPTY_VALUES);

  useEffect(() => {
    if (visible) setValues(EMPTY_VALUES);
  }, [visible]);

  const patch = (partial: Partial<NewContactFormValues>): void => {
    setValues((prev) => ({ ...prev, ...partial }));
  };

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const onDismissDatePicker = useCallback(() => {
    setDatePickerOpen(false);
  }, []);

  const onConfirmDate = useCallback(
    (params: { date: Date | undefined }) => {
      setDatePickerOpen(false);
      if (params.date) {
        const iso = params.date.toISOString().split('T')[0];
        patch({ dateOfBirth: iso ?? '' });
      }
    },
    [patch],
  );

  const parsedDate = values.dateOfBirth ? new Date(values.dateOfBirth) : undefined;

  const disabled = values.firstName.trim().length === 0 || values.lastName.trim().length === 0;

  const handleCreate = (): void => {
    if (disabled) return;
    onCreate(values);
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
            {t('wizard.primaryContact.newContact.title')}
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

        <View style={[styles.row, { marginTop: 20 }]}>
          <View style={[styles.cell, { marginRight: theme.spacing.sm }]}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
              {t('wizard.primaryContact.newContact.firstName')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.primaryContact.newContact.firstNamePlaceholder')}
              value={values.firstName}
              onChangeText={(next) => patch({ firstName: next })}
            />
          </View>
          <View style={styles.cell}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
              {t('wizard.primaryContact.newContact.lastName')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.primaryContact.newContact.lastNamePlaceholder')}
              value={values.lastName}
              onChangeText={(next) => patch({ lastName: next })}
            />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
            {t('wizard.primaryContact.newContact.jobPosition')}
          </Text>
          <TextInput
            mode="outlined"
            placeholder={t('wizard.primaryContact.newContact.jobPositionPlaceholder')}
            value={values.jobPosition}
            onChangeText={(next) => patch({ jobPosition: next })}
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
            {t('wizard.primaryContact.newContact.dateOfBirth')}
          </Text>
          <TouchableRipple onPress={() => setDatePickerOpen(true)}>
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                placeholder={t('wizard.primaryContact.newContact.dateOfBirthPlaceholder')}
                value={values.dateOfBirth}
                editable={false}
                left={<TextInput.Icon icon="calendar" />}
              />
            </View>
          </TouchableRipple>
          <DatePickerModal
            locale="en"
            mode="single"
            visible={datePickerOpen}
            onDismiss={onDismissDatePicker}
            date={parsedDate}
            onConfirm={onConfirmDate}
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
            {t('wizard.primaryContact.newContact.address')}
          </Text>
          <TextInput
            mode="outlined"
            placeholder={t('wizard.primaryContact.newContact.addressPlaceholder')}
            value={values.address}
            onChangeText={(next) => patch({ address: next })}
          />
        </View>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleCreate}
            disabled={disabled}
            style={styles.createButton}
            contentStyle={styles.createButtonContent}
          >
            {t('wizard.primaryContact.newContact.create')}
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
  row: { flexDirection: 'row' },
  cell: { flex: 1 },
  footer: { alignItems: 'flex-end', marginTop: 48 },
  createButton: { borderRadius: 8, minWidth: 180 },
  createButtonContent: { paddingVertical: 8 },
});
