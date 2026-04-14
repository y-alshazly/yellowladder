import { useGetShopsQuery } from '@yellowladder/shared-api';
import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { type GetShopResponse } from '@yellowladder/shared-types';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Button, Divider, Menu } from 'react-native-paper';

export interface ShopSelectorProps {
  selectedShopId: string | null;
  onSelectShop: (shopId: string | null) => void;
}

/**
 * Dropdown selector for switching between "All Shops" (company-level view)
 * and a specific shop. Renders as a Paper Menu anchored to a Button.
 */
export function ShopSelector({ selectedShopId, onSelectShop }: ShopSelectorProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { data } = useGetShopsQuery({});
  const [menuVisible, setMenuVisible] = useState(false);

  const shops = data?.data ?? [];
  const selectedShop = shops.find((s: GetShopResponse) => s.id === selectedShopId);
  const displayLabel = selectedShop ? selectedShop.name : t('catalog.allShops');

  const handleSelect = useCallback(
    (shopId: string | null) => {
      onSelectShop(shopId);
      setMenuVisible(false);
    },
    [onSelectShop],
  );

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button
          mode="text"
          icon="chevron-down"
          contentStyle={styles.buttonContent}
          labelStyle={{ color: theme.colors.onSurface }}
          onPress={() => setMenuVisible(true)}
        >
          {displayLabel}
        </Button>
      }
    >
      <Menu.Item
        onPress={() => handleSelect(null)}
        title={t('catalog.allShops')}
        leadingIcon="store"
      />
      {shops.length > 0 ? <Divider /> : null}
      {shops.map((shop: GetShopResponse) => (
        <Menu.Item
          key={shop.id}
          onPress={() => handleSelect(shop.id)}
          title={shop.name}
          leadingIcon={shop.id === selectedShopId ? 'check' : undefined}
        />
      ))}
    </Menu>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    flexDirection: 'row-reverse',
  },
});
