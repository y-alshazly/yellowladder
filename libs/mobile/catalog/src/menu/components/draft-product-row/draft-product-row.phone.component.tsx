import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput as RNTextInput, View } from 'react-native';
import { Icon, IconButton, Text } from 'react-native-paper';
import { catalogueStyles as styles } from '../../styles/catalogue.styles';
import type { DraftProductRowProps } from './draft-product-row.tablet.component';

export function PhoneDraftProductRow({
  category,
  name,
  price,
  onChangeName,
  onChangePrice,
  onCommit,
  onCancel,
}: DraftProductRowProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const committedRef = useRef(false);
  const priceInputRef = useRef<RNTextInput>(null);

  // Commits only when both name + price are ready. commitDraftItem in the
  // parent already enforces the validation; here we only de-dupe the call.
  const handleCommit = useCallback(() => {
    if (committedRef.current) return;
    if (!name.trim() || !price.trim()) return;
    committedRef.current = true;
    void onCommit();
  }, [name, price, onCommit]);

  return (
    <View style={styles.phoneProductSection}>
      <View style={styles.phoneProductTopRow}>
        <View style={styles.phoneProductCategoryTrigger}>
          {category.emojiCode ? (
            <Text style={{ fontSize: 18 }}>{category.emojiCode}</Text>
          ) : category.iconName ? (
            <Icon source={category.iconName} size={18} color={theme.colors.onSurface} />
          ) : (
            <Icon source="folder-outline" size={18} color={theme.colors.onSurfaceVariant} />
          )}
        </View>
        <RNTextInput
          value={name}
          onChangeText={onChangeName}
          onSubmitEditing={() => priceInputRef.current?.focus()}
          autoFocus
          returnKeyType="next"
          placeholder={t('catalog.menuItems.namePlaceholder')}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[
            styles.phoneProductNameInput,
            { color: theme.colors.onSurface, paddingVertical: 8 },
          ]}
        />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginRight: 2 }}>
          £
        </Text>
        <RNTextInput
          ref={priceInputRef}
          value={price}
          onChangeText={onChangePrice}
          onBlur={handleCommit}
          onEndEditing={handleCommit}
          onSubmitEditing={handleCommit}
          keyboardType="decimal-pad"
          returnKeyType="done"
          placeholder="0.00"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[
            styles.phoneProductPriceInput,
            { color: theme.colors.onSurface, paddingVertical: 8 },
          ]}
        />
        <IconButton
          icon="close"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={onCancel}
          accessibilityLabel={t('common.cancel')}
          style={styles.phoneProductTrashButton}
        />
      </View>
    </View>
  );
}
