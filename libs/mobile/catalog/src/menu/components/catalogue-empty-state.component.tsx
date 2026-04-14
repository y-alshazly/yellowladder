import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { catalogueStyles as styles } from '../styles/catalogue.styles';

/**
 * Empty-state placeholder shown when there are no categories yet.
 */
export function CatalogueEmptyState() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <View style={[styles.centered, { paddingVertical: theme.spacing.xxl }]}>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('catalog.categories.title')}
      </Text>
    </View>
  );
}
