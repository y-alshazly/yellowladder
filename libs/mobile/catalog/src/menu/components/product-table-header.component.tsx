import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { catalogueStyles as styles } from '../styles/catalogue.styles';

/**
 * Tablet column-label row above each expanded category's product table.
 * Mirrors the column flex tokens used by `TabletProductRow`.
 */
export function ProductTableHeader() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.tableHeaderRow,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          backgroundColor: theme.colors.surfaceVariant,
        },
      ]}
    >
      <Text variant="labelLarge" style={[styles.colName, { color: theme.colors.onSurfaceVariant }]}>
        {t('catalog.menuItems.productName')}
      </Text>
      <Text
        variant="labelLarge"
        style={[styles.colCategory, { color: theme.colors.onSurfaceVariant }]}
      >
        {t('catalog.menuItems.category')}
      </Text>
      <Text
        variant="labelLarge"
        style={[styles.colPrice, { color: theme.colors.onSurfaceVariant }]}
      >
        {t('catalog.menuItems.basePrice')}
      </Text>
      <Text
        variant="labelLarge"
        style={[styles.colAddons, { color: theme.colors.onSurfaceVariant }]}
      >
        {t('catalog.menuItems.addons')}
      </Text>
      <View style={styles.colAction} />
    </View>
  );
}
