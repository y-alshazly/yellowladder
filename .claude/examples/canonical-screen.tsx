// @ts-nocheck
// CANONICAL EXAMPLE: React Native + Paper Screen Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new mobile screen.
//
// Key conventions demonstrated:
// 1. Functional component, named export (one exception: navigators, see project.md)
// 2. Props interface from React Navigation's NativeStackScreenProps for type-safe nav
// 3. useTranslation() for all user-facing strings
// 4. RTK Query hooks shared with web (libs/shared/api)
// 5. React Native Paper components — no custom UI primitives
// 6. RBAC UI gating via <HasPermission> and useHasPermission() from shared/mobile-ui
//    — NO CanAction, NO CanField, NO useAbilitySync (those were CASL-era)
// 7. Theme tokens from useTheme() — no hardcoded colors or magic numbers
// 8. SafeAreaView from react-native-safe-area-context
// 9. Online-only — no offline state, no SQLite

import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateMenuItemMutation } from '@yellowladder/shared-api';
import { HasPermission, useHasPermission } from '@yellowladder/shared-mobile-ui';
import { Permissions } from '@yellowladder/shared-types';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/root.params';
import { createMenuItemSchema, type CreateMenuItemForm } from './create-menu-item.schema';

// Type-safe props from React Navigation
type Props = NativeStackScreenProps<RootStackParamList, 'CreateMenuItem'>;

export function CreateMenuItemScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [createMenuItem, { isLoading }] = useCreateMenuItemMutation();

  // Imperative permission check — use the hook when you need a boolean inside logic
  // (e.g., conditionally disabling a single field while keeping the rest enabled).
  // EMPLOYEE cannot edit price under the canonical RBAC policy.
  const canEditPrice = useHasPermission(Permissions.MenuItemsUpdate);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMenuItemForm>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues: route.params?.initialValues,
  });

  const onSubmit = async (data: CreateMenuItemForm) => {
    try {
      const result = await createMenuItem(data).unwrap();
      navigation.navigate('MenuItemDetail', { id: result.id });
    } catch {
      // RTK Query handles error state — UI shows it below
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={[styles.scroll, { padding: theme.spacing(2) }]}>
        <Card style={{ marginBottom: theme.spacing(2) }}>
          <Card.Content>
            {/* Name fields are always visible to anyone who can reach this screen;
                authorization for the whole screen is gated by a route guard upstream. */}
            <Controller
              control={control}
              name="nameEn"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: theme.spacing(1.5) }}>
                  <TextInput
                    label={t('catalog.menuItems.nameEn')}
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.nameEn}
                  />
                  <HelperText type="error" visible={!!errors.nameEn}>
                    {errors.nameEn?.message}
                  </HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="nameDe"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: theme.spacing(1.5) }}>
                  <TextInput
                    label={t('catalog.menuItems.nameDe')}
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.nameDe}
                  />
                  <HelperText type="error" visible={!!errors.nameDe}>
                    {errors.nameDe?.message}
                  </HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="nameFr"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: theme.spacing(1.5) }}>
                  <TextInput
                    label={t('catalog.menuItems.nameFr')}
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.nameFr}
                  />
                  <HelperText type="error" visible={!!errors.nameFr}>
                    {errors.nameFr?.message}
                  </HelperText>
                </View>
              )}
            />

            {/* Field-level gating via the imperative hook:
                the price input is visible but disabled for roles that lack MenuItemsUpdate
                (e.g., EMPLOYEE). The backend service ALSO redacts basePrice from the payload,
                so the UI disable is defense-in-depth, not the security boundary. */}
            <Controller
              control={control}
              name="basePrice"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: theme.spacing(1.5) }}>
                  <TextInput
                    label={t('catalog.menuItems.basePrice')}
                    mode="outlined"
                    keyboardType="number-pad"
                    value={value?.toString() ?? ''}
                    onChangeText={(text) => onChange(parseInt(text, 10) || 0)}
                    onBlur={onBlur}
                    error={!!errors.basePrice}
                    disabled={!canEditPrice}
                  />
                  <HelperText type={errors.basePrice ? 'error' : 'info'} visible>
                    {errors.basePrice?.message ?? t('catalog.menuItems.priceHelper')}
                  </HelperText>
                </View>
              )}
            />
          </Card.Content>
        </Card>

        {/* Submit button wrapped in <HasPermission>. mode="disable" keeps the button visible
            but greyed out for users without the permission. mode="hide" (default) removes it. */}
        <HasPermission permission={Permissions.MenuItemsCreate} mode="disable">
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            loading={isLoading}
            icon={isLoading ? undefined : 'content-save'}
          >
            {t('common.save')}
          </Button>
        </HasPermission>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
});

// NOTE on theme tokens:
// React Native Paper exposes theme.spacing(n), theme.colors.*, theme.roundness — use these
// instead of hardcoded numbers. The Yellow Ladder Paper theme lives in shared/mobile-ui.
//
// NOTE on layout direction:
// Yellow Ladder is LTR-only across all three supported locales (en, de, fr).
// No I18nManager.forceRTL calls, no RTL handling — screens render left-to-right always.
