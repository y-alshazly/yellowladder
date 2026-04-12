import { useNavigation } from '@react-navigation/native';
import { FormScreenLayout, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  addContact,
  confirmAuthorisation,
  removeContact,
  selectContact,
  selectWizardAuthorisationConfirmed,
  selectWizardContacts,
  selectWizardSelectedContactId,
  setAuthorisationConfirmed,
  useAppDispatch,
  useAppSelector,
  type WizardContact,
} from '@yellowladder/shared-store';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import {
  Checkbox,
  Chip,
  HelperText,
  IconButton,
  List,
  RadioButton,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { NewContactModal } from '../components/new-contact-modal.component';
import { WizardBottomBar } from '../components/wizard-bottom-bar.component';
import { useWizardDraft } from '../hooks/use-wizard-draft.hook';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';

const WIZARD_TOTAL_STEPS = 4;

/**
 * Wizard step 4 dot (LIMITED_COMPANY branch): "Select primary contact".
 *
 * Renders the Companies House PSC list as a radio group, lets the user
 * add an arbitrary number of custom contacts via the `NewContactModal`,
 * and captures the authorisation checkbox. The final forward action
 * navigates to the OTP verification screen — the company creation call
 * fires from there after the email is verified.
 */
export function WizardPrimaryContactScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const dispatch = useAppDispatch();
  const { state: draft } = useWizardDraft();
  const contacts = useAppSelector(selectWizardContacts);
  const selectedContactId = useAppSelector(selectWizardSelectedContactId);
  const authorisationConfirmed = useAppSelector(selectWizardAuthorisationConfirmed);
  const [newContactModalVisible, setNewContactModalVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const companyName = draft.companyOverrides.name ?? draft.companiesHouseLookup?.companyName ?? '';

  const canGoForward = useMemo(
    () => Boolean(selectedContactId) && authorisationConfirmed,
    [selectedContactId, authorisationConfirmed],
  );

  const handleForward = (): void => {
    setServerError(null);
    if (!canGoForward) return;
    if (!draft.accountData?.email) {
      setServerError(t('common.somethingWentWrong'));
      return;
    }
    dispatch(confirmAuthorisation(new Date().toISOString()));
    navigation.navigate('VerifyEmail', { email: draft.accountData.email });
  };

  const handleCreateContact = (values: {
    firstName: string;
    lastName: string;
    jobPosition: string;
    dateOfBirth: string;
    address: string;
  }): void => {
    const id = `manual-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const contact: WizardContact = {
      id,
      firstName: values.firstName,
      lastName: values.lastName,
      jobPosition: values.jobPosition || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      address: values.address || undefined,
      source: 'MANUAL',
      isNew: true,
    };
    dispatch(addContact(contact));
    setNewContactModalVisible(false);
  };

  return (
    <FormScreenLayout
      title={t('wizard.primaryContact.title')}
      brandHeadline={t('common.brand.headline')}
      brandTestimonial={t('common.brand.testimonial')}
      brandAttribution={t('common.brand.attribution')}
      footer={
        <WizardBottomBar
          currentStep={4}
          totalSteps={WIZARD_TOTAL_STEPS}
          onBack={() => navigation.goBack()}
          onForward={handleForward}
          forwardDisabled={!canGoForward}
        />
      }
    >
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.sm }}
      >
        {t('wizard.primaryContact.contactsFrom', { companyName })}
      </Text>

      <RadioButton.Group
        value={selectedContactId ?? ''}
        onValueChange={(value) => dispatch(selectContact(value))}
      >
        {contacts.length === 0 ? (
          <HelperText type="info" visible>
            {t('wizard.primaryContact.noPscContacts')}
          </HelperText>
        ) : (
          contacts.map((contact) => (
            <List.Item
              key={contact.id}
              title={`${contact.firstName} ${contact.lastName}`.trim()}
              description={contact.jobPosition}
              left={() => (
                <RadioButton.Android
                  value={contact.id}
                  status={selectedContactId === contact.id ? 'checked' : 'unchecked'}
                  onPress={() => dispatch(selectContact(contact.id))}
                />
              )}
              right={() =>
                contact.source === 'MANUAL' ? (
                  <View style={styles.manualActions}>
                    {contact.isNew ? (
                      <Chip compact style={{ marginRight: theme.spacing.xs }}>
                        {t('wizard.primaryContact.newBadge')}
                      </Chip>
                    ) : null}
                    <IconButton
                      icon="delete-outline"
                      size={18}
                      accessibilityLabel={t('common.cancel')}
                      onPress={() => dispatch(removeContact(contact.id))}
                    />
                  </View>
                ) : null
              }
              onPress={() => dispatch(selectContact(contact.id))}
            />
          ))
        )}
      </RadioButton.Group>

      <TouchableRipple
        onPress={() => setNewContactModalVisible(true)}
        style={[styles.addNewRow, { marginTop: theme.spacing.sm }]}
      >
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.primary,
            textDecorationLine: 'underline',
          }}
        >
          {t('wizard.primaryContact.addNew')}
        </Text>
      </TouchableRipple>

      <View
        style={[
          styles.authBox,
          {
            borderColor: theme.colors.outlineVariant,
            padding: theme.spacing.sm,
            marginTop: theme.spacing.lg,
          },
        ]}
      >
        <Checkbox.Android
          status={authorisationConfirmed ? 'checked' : 'unchecked'}
          onPress={() => dispatch(setAuthorisationConfirmed(!authorisationConfirmed))}
        />
        <Text style={{ color: theme.colors.onSurface, flex: 1 }}>
          {t('wizard.primaryContact.authorisationConfirmation')}
        </Text>
      </View>

      {serverError ? (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      ) : null}

      <NewContactModal
        visible={newContactModalVisible}
        onDismiss={() => setNewContactModalVisible(false)}
        onCreate={handleCreateContact}
      />
    </FormScreenLayout>
  );
}

const styles = StyleSheet.create({
  manualActions: { flexDirection: 'row', alignItems: 'center' },
  addNewRow: { paddingVertical: 8 },
  authBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
});
