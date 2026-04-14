import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { type GetCategoryResponse } from '@yellowladder/shared-types';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput as RNTextInput, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { catalogueStyles as styles } from '../../styles/catalogue.styles';

export interface DraftProductRowProps {
  category: GetCategoryResponse;
  name: string;
  price: string;
  onChangeName: (next: string) => void;
  onChangePrice: (next: string) => void;
  onCommit: () => Promise<void> | void;
  onCancel: () => void;
}

export function TabletDraftProductRow({
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

  const handleCommit = useCallback(() => {
    if (committedRef.current) return;
    if (!name.trim() || !price.trim()) return;
    committedRef.current = true;
    void onCommit();
  }, [name, price, onCommit]);

  return (
    <View
      style={[
        styles.tableRow,
        {
          paddingHorizontal: theme.spacing.lg,
          borderBottomColor: theme.colors.outlineVariant,
          borderBottomWidth: 1,
        },
      ]}
    >
      <View style={styles.colName}>
        <RNTextInput
          value={name}
          onChangeText={onChangeName}
          onSubmitEditing={() => priceInputRef.current?.focus()}
          autoFocus
          returnKeyType="next"
          placeholder={t('catalog.menuItems.namePlaceholder')}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={{
            fontSize: 15,
            color: theme.colors.onSurface,
            paddingVertical: 8,
          }}
        />
      </View>
      <View style={styles.colCategory}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {category.nameEn}
        </Text>
      </View>
      <View style={styles.colPrice}>
        <RNTextInput
          ref={priceInputRef}
          value={price}
          onChangeText={onChangePrice}
          onBlur={handleCommit}
          onEndEditing={handleCommit}
          onSubmitEditing={handleCommit}
          keyboardType="decimal-pad"
          returnKeyType="done"
          placeholder="£0.00"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={{
            fontSize: 15,
            color: theme.colors.onSurface,
            paddingVertical: 8,
          }}
        />
      </View>
      <View style={styles.colAddons} />
      <View style={styles.colAction}>
        <IconButton
          icon="close"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={onCancel}
          accessibilityLabel={t('common.cancel')}
        />
      </View>
    </View>
  );
}
