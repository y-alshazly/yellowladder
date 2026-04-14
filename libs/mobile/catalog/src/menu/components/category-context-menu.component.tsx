import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Menu } from 'react-native-paper';

export interface CategoryContextMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Three-dot context menu for category rows. Shows Edit and Delete actions.
 * Delete is rendered in the error color per the design.
 */
export function CategoryContextMenu({ onEdit, onDelete }: CategoryContextMenuProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={<IconButton icon="dots-vertical" size={20} onPress={() => setVisible(true)} />}
    >
      <Menu.Item
        onPress={() => {
          setVisible(false);
          onEdit();
        }}
        title={t('catalog.categories.editCategory')}
        leadingIcon="pencil"
      />
      <Menu.Item
        onPress={() => {
          setVisible(false);
          onDelete();
        }}
        title={t('catalog.categories.deleteCategory')}
        titleStyle={{ color: theme.colors.error }}
        leadingIcon="delete"
      />
    </Menu>
  );
}
