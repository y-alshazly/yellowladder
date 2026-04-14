import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useGetShopByIdQuery, useUpdateShopMutation } from '@yellowladder/shared-api';
import { SafeScreen, useAppTheme, useToast } from '@yellowladder/shared-mobile-ui';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text } from 'react-native-paper';
import { StoreFormFields } from './store-form-fields.component';
import {
  emptyStoreFormValues,
  shopToStoreFormValues,
  storeFormSchema,
  toUpdateShopRequest,
  type StoreFormValues,
} from './store-form.schema';

type EditStoreRoute = RouteProp<{ EditStore: { shopId: string } }, 'EditStore'>;

export function EditStoreScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<EditStoreRoute>();
  const { shopId } = route.params;
  const { showSuccess, showError } = useToast();

  const { data: shop, isLoading: isLoadingShop } = useGetShopByIdQuery(shopId);
  const [updateShop, { isLoading: isSaving }] = useUpdateShopMutation();

  const { control, handleSubmit, reset, watch, setValue } = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: emptyStoreFormValues,
  });

  useEffect(() => {
    if (shop) {
      reset(shopToStoreFormValues(shop));
    }
  }, [shop, reset]);

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
        await updateShop({ id: shopId, body: toUpdateShopRequest(values) }).unwrap();
        showSuccess(t('stores.storeUpdated'));
        goBack();
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [shopId, updateShop, showSuccess, showError, t, goBack],
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
          {t('stores.editStoreTitle')}
        </Text>
        <IconButton
          icon="close"
          mode="outlined"
          size={20}
          onPress={goBack}
          accessibilityLabel={t('common.close')}
        />
      </View>

      {isLoadingShop ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
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
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveButton}
            >
              {t('common.save')}
            </Button>
          </View>
        </>
      )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
