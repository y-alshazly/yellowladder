import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { type GetCategoryResponse } from '@yellowladder/shared-types';
import { Pressable } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { catalogueStyles as styles } from '../styles/catalogue.styles';
import { CategoryContextMenu } from './category-context-menu.component';

export interface CategoryAccordionHeaderProps {
  category: GetCategoryResponse;
  isExpanded: boolean;
  itemCount: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Tablet accordion header for a category. Renders the chevron, optional
 * emoji/icon, name, item count, and the three-dot context menu.
 */
export function CategoryAccordionHeader({
  category,
  isExpanded,
  itemCount,
  onToggle,
  onEdit,
  onDelete,
}: CategoryAccordionHeaderProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.tabletCategoryHeader,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          backgroundColor: isExpanded ? theme.colors.surfaceVariant : theme.colors.surface,
        },
      ]}
    >
      <Icon
        source={isExpanded ? 'chevron-down' : 'chevron-right'}
        size={24}
        color={theme.colors.onSurface}
      />
      {category.emojiCode ? (
        <Text style={styles.categoryEmoji}>{category.emojiCode}</Text>
      ) : category.iconName ? (
        <Icon source={category.iconName} size={20} color={theme.colors.onSurface} />
      ) : null}
      <Text variant="titleMedium" style={{ flex: 1, color: theme.colors.onSurface }}>
        {category.nameEn}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}>
        {itemCount}
      </Text>
      <CategoryContextMenu onEdit={onEdit} onDelete={onDelete} />
    </Pressable>
  );
}
