import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useArchiveShopMutation,
  useGetShopsQuery,
  useUnarchiveShopMutation,
} from '@yellowladder/shared-api';
import {
  AppHeader,
  meetsRoleRequirement,
  SafeScreen,
  useAppTheme,
  useToast,
} from '@yellowladder/shared-mobile-ui';
import { selectCurrentUser, useAppSelector } from '@yellowladder/shared-store';
import { UserRole, type GetShopResponse } from '@yellowladder/shared-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, DataTable, IconButton, Menu, Text } from 'react-native-paper';

type StoresStackParamList = {
  Stores: undefined;
  AddStore: undefined;
  EditStore: { shopId: string };
  [key: string]: undefined | object;
};

const MENU_SURFACE = '#FFFFFF';
const TABLE_BORDER = '#F2F2F3';
const ROW_HEIGHT = 56;
const NUMBER_OF_ITEMS_PER_PAGE_LIST = [10, 25, 50] as const;

export function StoresListScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { showSuccess, showError } = useToast();
  const user = useAppSelector(selectCurrentUser);
  const navigation = useNavigation<NativeStackNavigationProp<StoresStackParamList>>();

  const canCreate = useMemo(
    () => meetsRoleRequirement(user?.role ?? null, UserRole.CompanyAdmin),
    [user?.role],
  );
  const canUpdate = useMemo(
    () => meetsRoleRequirement(user?.role ?? null, UserRole.ShopManager),
    [user?.role],
  );
  const canArchive = useMemo(
    () => meetsRoleRequirement(user?.role ?? null, UserRole.CompanyAdmin),
    [user?.role],
  );

  const { data, isLoading } = useGetShopsQuery({ includeArchived: true });
  const [archiveShop] = useArchiveShopMutation();
  const [unarchiveShop] = useUnarchiveShopMutation();

  const [menuShopId, setMenuShopId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(NUMBER_OF_ITEMS_PER_PAGE_LIST[0]);

  const shops = data?.data ?? [];
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, shops.length);
  const pageShops = shops.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

  const handleArchive = useCallback(
    async (shopId: string) => {
      setMenuShopId(null);
      try {
        await archiveShop(shopId).unwrap();
        showSuccess(t('stores.storeArchived'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [archiveShop, showSuccess, showError, t],
  );

  const handleRestore = useCallback(
    async (shopId: string) => {
      setMenuShopId(null);
      try {
        await unarchiveShop(shopId).unwrap();
        showSuccess(t('stores.storeRestored'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [unarchiveShop, showSuccess, showError, t],
  );

  const handleEdit = useCallback(
    (shopId: string) => {
      setMenuShopId(null);
      navigation.navigate('EditStore', { shopId });
    },
    [navigation],
  );

  const handleAdd = useCallback(() => {
    navigation.navigate('AddStore');
  }, [navigation]);

  const renderRow = (item: GetShopResponse) => {
    const isMenuOpen = menuShopId === item.id;
    const rowTextColor = item.isArchived ? theme.colors.onSurfaceVariant : theme.colors.onSurface;
    const iconColor = item.isArchived ? theme.colors.onSurfaceVariant : theme.colors.onSurface;

    return (
      <DataTable.Row key={item.id} style={styles.row}>
        <DataTable.Cell>
          <Text variant="bodyLarge" style={{ color: rowTextColor }}>
            {item.name}
            {item.isArchived ? ` ${t('stores.archived')}` : ''}
          </Text>
        </DataTable.Cell>

        <DataTable.Cell style={styles.actionsCell}>
          {canUpdate || canArchive ? (
            <Menu
              visible={isMenuOpen}
              onDismiss={() => setMenuShopId(null)}
              contentStyle={{ backgroundColor: MENU_SURFACE }}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  iconColor={iconColor}
                  onPress={() => setMenuShopId(item.id)}
                />
              }
            >
              {canUpdate ? (
                <Menu.Item onPress={() => handleEdit(item.id)} title={t('stores.editStore')} />
              ) : null}
              {canArchive ? (
                item.isArchived ? (
                  <Menu.Item onPress={() => handleRestore(item.id)} title={t('stores.restore')} />
                ) : (
                  <Menu.Item onPress={() => handleArchive(item.id)} title={t('stores.archive')} />
                )
              ) : null}
            </Menu>
          ) : null}
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  return (
    <SafeScreen noPadding>
      <AppHeader
        title={t('stores.title')}
        rightAction={
          canCreate ? (
            <Button mode="contained" onPress={handleAdd} style={styles.addButton}>
              {t('stores.addStore')}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <DataTable style={styles.table}>
          <DataTable.Header style={styles.header}>
            <DataTable.Title>{t('stores.storeName')}</DataTable.Title>
            <DataTable.Title style={styles.actionsCell}>{''}</DataTable.Title>
          </DataTable.Header>

          {shops.length === 0 ? (
            <View style={styles.centered}>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                {t('stores.noStores')}
              </Text>
            </View>
          ) : (
            <>
              {pageShops.map(renderRow)}

              <DataTable.Pagination
                page={page}
                numberOfPages={Math.max(1, Math.ceil(shops.length / itemsPerPage))}
                onPageChange={setPage}
                label={t('common.paginationLabel', {
                  from: from + 1,
                  to,
                  total: shops.length,
                })}
                numberOfItemsPerPageList={[...NUMBER_OF_ITEMS_PER_PAGE_LIST]}
                numberOfItemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                showFastPaginationControls
                selectPageDropdownLabel={t('common.rowsPerPage')}
                theme={{
                  colors: {
                    elevation: {
                      ...theme.colors.elevation,
                      level2: '#FFFFFF',
                    },
                  },
                }}
              />
            </>
          )}
        </DataTable>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    borderRadius: 8,
  },
  table: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: TABLE_BORDER,
    borderTopWidth: 1,
    borderTopColor: TABLE_BORDER,
    height: ROW_HEIGHT,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: TABLE_BORDER,
    minHeight: ROW_HEIGHT,
  },
  actionsCell: {
    flex: 0,
    width: 56,
    justifyContent: 'flex-end',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
});
