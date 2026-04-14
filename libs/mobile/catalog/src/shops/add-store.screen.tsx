import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useCreateShopMutation } from '@yellowladder/shared-api';
import { SafeScreen, useAppTheme, useToast } from '@yellowladder/shared-mobile-ui';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { StoreFormFields } from './store-form-fields.component';
import {
  emptyStoreFormValues,
  storeFormSchema,
  toCreateShopRequest,
  type StoreFormValues,
} from './store-form.schema';

export function AddStoreScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { showSuccess, showError } = useToast();
  const [createShop, { isLoading }] = useCreateShopMutation();

  const { control, handleSubmit, watch, setValue } = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: emptyStoreFormValues,
  });

  const city = watch('city') ?? '';

  const handleClearAddress = useCallback(() => {
    setValue('city', '');
    setValue('addressLine1', '');
    setValue('postcode', '');
    setValue('addressLine2', '');
    setValue('region', '');
  }, [setValue]);

  const handleSelectCity = useCallback(
    (name: string) => {
      setValue('city', name);
    },
    [setValue],
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onSubmit = useCallback(
    async (values: StoreFormValues) => {
      try {
        await createShop(toCreateShopRequest(values)).unwrap();
        showSuccess(t('stores.storeCreated'));
        goBack();
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [createShop, showSuccess, showError, t, goBack],
  );

  return (
    <SafeScreen noPadding>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
          },
        ]}
      >
        <Text variant="titleLarge" style={styles.title}>
          {t('stores.addStoreTitle')}
        </Text>
        <IconButton
          icon="close"
          mode="outlined"
          size={20}
          onPress={goBack}
          accessibilityLabel={t('common.close')}
        />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
        ]}
      >
        <StoreFormFields
          control={control}
          city={city}
          onClearAddress={handleClearAddress}
          onSelectCity={handleSelectCity}
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
        >
          {t('common.save')}
        </Button>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveButton: {
    borderRadius: 8,
    minWidth: 140,
  },
});
