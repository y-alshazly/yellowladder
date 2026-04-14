import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '@yellowladder/shared-api';
import {
  FormTextField,
  useAppTheme,
  useDeviceClass,
  useToast,
} from '@yellowladder/shared-mobile-ui';
import type { GetCategoryResponse } from '@yellowladder/shared-types';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Modal, Portal, SegmentedButtons, Text } from 'react-native-paper';
import {
  createCategorySchema,
  toCreateCategoryRequest,
  type CreateCategoryFormValues,
} from '../schemas/create-category.schema';

/**
 * Common food-related Material Community Icons for category icon selection.
 */
const ICON_OPTIONS = [
  'coffee',
  'food',
  'food-apple',
  'food-croissant',
  'food-drumstick',
  'food-fork-drink',
  'food-hot-dog',
  'food-steak',
  'food-turkey',
  'food-variant',
  'glass-cocktail',
  'glass-mug-variant',
  'beer',
  'cup',
  'cupcake',
  'ice-cream',
  'pizza',
  'pasta',
  'fruit-grapes',
  'fruit-watermelon',
  'bread-slice',
  'cake-variant',
  'cookie',
  'egg-fried',
] as const;

/**
 * Common food-related emojis for category emoji selection.
 */
const EMOJI_OPTIONS = [
  '\u2615',
  '\uD83C\uDF54',
  '\uD83C\uDF55',
  '\uD83C\uDF5E',
  '\uD83C\uDF5F',
  '\uD83C\uDF69',
  '\uD83C\uDF6A',
  '\uD83C\uDF70',
  '\uD83C\uDF72',
  '\uD83C\uDF73',
  '\uD83C\uDF7A',
  '\uD83C\uDF7B',
  '\uD83C\uDF7D\uFE0F',
  '\uD83E\uDD50',
  '\uD83E\uDD57',
  '\uD83E\uDD69',
  '\uD83E\uDD6A',
  '\uD83C\uDF63',
  '\uD83C\uDF5C',
  '\uD83C\uDF5D',
  '\uD83E\uDDC1',
  '\uD83C\uDF53',
  '\uD83C\uDF47',
  '\uD83E\uDD5E',
] as const;

type PickerTab = 'icon' | 'emoji';

export interface AddCategoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  /** When provided, the modal operates in edit mode with pre-filled values. */
  editCategory?: GetCategoryResponse | null;
}

/**
 * Centered modal dialog for creating or editing a category. Matches the
 * EditCompanyModal layout: white surface, rounded corners, circular close
 * button in the header, Save action pinned at the bottom-right.
 */
export function AddCategoryModal({ visible, onDismiss, editCategory }: AddCategoryModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { deviceClass } = useDeviceClass();
  const { showSuccess, showError } = useToast();
  const isPhone = deviceClass === 'phone';
  const isEditing = Boolean(editCategory);

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const isLoading = isCreating || isUpdating;

  const [pickerTab, setPickerTab] = useState<PickerTab>('icon');

  const { control, handleSubmit, reset, setValue, watch } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      nameEn: '',
      nameDe: '',
      nameFr: '',
      iconName: null,
      emojiCode: null,
    },
  });

  const selectedIcon = watch('iconName');
  const selectedEmoji = watch('emojiCode');

  useEffect(() => {
    if (visible) {
      if (editCategory) {
        reset({
          nameEn: editCategory.nameEn,
          nameDe: editCategory.nameDe,
          nameFr: editCategory.nameFr,
          iconName: editCategory.iconName,
          emojiCode: editCategory.emojiCode,
        });
        setPickerTab(editCategory.emojiCode ? 'emoji' : 'icon');
      } else {
        reset({
          nameEn: '',
          nameDe: '',
          nameFr: '',
          iconName: null,
          emojiCode: null,
        });
        setPickerTab('icon');
      }
    }
  }, [visible, editCategory, reset]);

  const handleIconSelect = useCallback(
    (iconName: string) => {
      setValue('iconName', iconName);
      setValue('emojiCode', null);
    },
    [setValue],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      setValue('emojiCode', emoji);
      setValue('iconName', null);
    },
    [setValue],
  );

  const onSubmit = useCallback(
    async (values: CreateCategoryFormValues) => {
      try {
        if (isEditing && editCategory) {
          await updateCategory({
            id: editCategory.id,
            body: {
              nameEn: values.nameEn,
              nameDe: values.nameDe || values.nameEn,
              nameFr: values.nameFr || values.nameEn,
              iconName: values.iconName ?? null,
              emojiCode: values.emojiCode ?? null,
            },
          }).unwrap();
          showSuccess(t('catalog.categories.updated'));
        } else {
          await createCategory(toCreateCategoryRequest(values)).unwrap();
          showSuccess(t('catalog.categories.created'));
        }
        onDismiss();
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [isEditing, editCategory, createCategory, updateCategory, showSuccess, showError, t, onDismiss],
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        style={styles.backdrop}
        contentContainerStyle={[styles.content, { width: isPhone ? '92%' : 520 }]}
      >
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.title}>
            {isEditing ? t('catalog.categories.editCategory') : t('catalog.categories.addCategory')}
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

        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormTextField
            control={control}
            name="nameEn"
            label={t('catalog.categories.title')}
            placeholder={t('catalog.categories.namePlaceholder')}
          />

          <View style={{ marginTop: 8, marginBottom: theme.spacing.md }}>
            <SegmentedButtons
              value={pickerTab}
              onValueChange={(value) => setPickerTab(value as PickerTab)}
              buttons={[
                { value: 'icon', label: t('catalog.categories.iconTab'), icon: 'shape' },
                { value: 'emoji', label: t('catalog.categories.emojiTab'), icon: 'emoticon' },
              ]}
            />
          </View>

          {pickerTab === 'icon' ? (
            <View style={styles.grid}>
              {ICON_OPTIONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <Pressable
                    key={iconName}
                    onPress={() => handleIconSelect(iconName)}
                    style={[
                      styles.gridItem,
                      {
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                        backgroundColor: isSelected ? theme.colors.primaryContainer : '#FFFFFF',
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <IconButton icon={iconName} size={28} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {pickerTab === 'emoji' ? (
            <View style={styles.grid}>
              {EMOJI_OPTIONS.map((emoji) => {
                const isSelected = selectedEmoji === emoji;
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => handleEmojiSelect(emoji)}
                    style={[
                      styles.gridItem,
                      {
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                        backgroundColor: isSelected ? theme.colors.primaryContainer : '#FFFFFF',
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button mode="text" onPress={onDismiss} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {t('common.save')}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
  },
  scroll: {
    marginTop: 16,
    maxHeight: 420,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '800',
    flex: 1,
  },
  closeButton: {
    borderColor: '#D7D7D8',
    borderWidth: 1,
    borderRadius: 999,
    margin: -8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: 56,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  saveButton: {
    borderRadius: 8,
    minWidth: 120,
  },
  saveButtonContent: {
    paddingVertical: 4,
  },
});
