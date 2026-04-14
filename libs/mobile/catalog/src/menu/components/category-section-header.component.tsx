import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { type GetCategoryResponse } from '@yellowladder/shared-types';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { catalogueStyles as styles } from '../styles/catalogue.styles';
import { CategoryContextMenu } from './category-context-menu.component';

export interface CategorySectionHeaderProps {
  category: GetCategoryResponse;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Phone section header for a category. Renders the icon tile, name, and
 * three-dot context menu in a horizontal row.
 */
export function CategorySectionHeader({ category, onEdit, onDelete }: CategorySectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.phoneCategoryHeader}>
      <View style={styles.phoneCategoryHeaderLeft}>
        <View
          style={[
            styles.phoneCategoryIconTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          {category.emojiCode ? (
            <Text style={{ fontSize: 22 }}>{category.emojiCode}</Text>
          ) : category.iconName ? (
            <Icon source={category.iconName} size={22} color={theme.colors.onSurface} />
          ) : (
            <Icon source="folder-outline" size={22} color={theme.colors.onSurfaceVariant} />
          )}
        </View>
        <Text
          variant="titleMedium"
          style={{
            color: theme.colors.onBackground,
            fontWeight: '700',
          }}
        >
          {category.nameEn}
        </Text>
      </View>
      <CategoryContextMenu onEdit={onEdit} onDelete={onDelete} />
    </View>
  );
}
