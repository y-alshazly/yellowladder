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
// 6. CASL UI gating via <CanAction> and <CanField> from shared/mobile-ui
// 7. Theme tokens from useTheme() — no hardcoded colors or magic numbers
// 8. SafeAreaView from react-native-safe-area-context
// 9. Online-only — no offline state, no SQLite

import {
  ActivityIndicator,
  Button,
  Card,
  HelperText,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CanAction, CanField } from '@yellowladder/shared-mobile-ui';
import { useCreateMenuItemMutation } from '@yellowladder/shared-api';
import {
  createMenuItemSchema,
  type CreateMenuItemForm,
} from './create-menu-item.schema';
import type { RootStackParamList } from '../../navigation/root.params';

// Type-safe props from React Navigation
type Props = NativeStackScreenProps<RootStackParamList, 'CreateMenuItem'>;

export function CreateMenuItemScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [createMenuItem, { isLoading }] = useCreateMenuItemMutation();

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
            <CanField action="Create" subject="MenuItem" field="nameEn">
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
            </CanField>

            <CanField action="Create" subject="MenuItem" field="nameAr">
              <Controller
                control={control}
                name="nameAr"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ marginBottom: theme.spacing(1.5) }}>
                    <TextInput
                      label={t('catalog.menuItems.nameAr')}
                      mode="outlined"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.nameAr}
                    />
                    <HelperText type="error" visible={!!errors.nameAr}>
                      {errors.nameAr?.message}
                    </HelperText>
                  </View>
                )}
              />
            </CanField>

            <CanField action="Create" subject="MenuItem" field="basePrice">
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
                    />
                    <HelperText type={errors.basePrice ? 'error' : 'info'} visible>
                      {errors.basePrice?.message ?? t('catalog.menuItems.priceHelper')}
                    </HelperText>
                  </View>
                )}
              />
            </CanField>
          </Card.Content>
        </Card>

        <CanAction action="Create" subject="MenuItem" mode="disable">
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            loading={isLoading}
            icon={isLoading ? undefined : 'content-save'}
          >
            {t('common.save')}
          </Button>
        </CanAction>
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
// NOTE on RTL:
// Paper handles RTL via I18nManager.isRTL automatically. The app shell calls
// I18nManager.forceRTL(true) on locale switch and triggers a reload.
