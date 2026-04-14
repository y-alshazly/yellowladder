import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDeleteTeamMemberMutation, useGetTeamMembersQuery } from '@yellowladder/shared-api';
import {
  AppHeader,
  DeleteConfirmDialog,
  HasPermission,
  SafeScreen,
  useAppTheme,
  useToast,
} from '@yellowladder/shared-mobile-ui';
import { selectCurrentUser, useAppSelector } from '@yellowladder/shared-store';
import { Permissions, type GetTeamMemberResponse } from '@yellowladder/shared-types';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, DataTable, IconButton, Menu, Text } from 'react-native-paper';
import { RoleBadge } from './role-badge.component';

type SettingsStackParamList = {
  Members: undefined;
  AddMember: undefined;
  MemberDetail: { memberId: string };
  [key: string]: undefined | object;
};

const MENU_SURFACE = '#FFFFFF';
const TABLE_BORDER = '#F2F2F3';
const ROW_HEIGHT = 56;
const NUMBER_OF_ITEMS_PER_PAGE_LIST = [10, 25, 50] as const;

export function TeamMembersScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { showSuccess, showError } = useToast();
  const user = useAppSelector(selectCurrentUser);
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  const { data: membersData, isLoading } = useGetTeamMembersQuery({});
  const [deleteTeamMember] = useDeleteTeamMemberMutation();

  const [menuMemberId, setMenuMemberId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(NUMBER_OF_ITEMS_PER_PAGE_LIST[0]);

  const members = membersData?.data ?? [];
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, members.length);
  const pageMembers = members.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

  const handleEdit = useCallback(
    (memberId: string) => {
      setMenuMemberId(null);
      navigation.navigate('MemberDetail', { memberId });
    },
    [navigation],
  );

  const handleAdd = useCallback(() => {
    navigation.navigate('AddMember');
  }, [navigation]);

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await deleteTeamMember(id).unwrap();
      showSuccess(t('team.memberDeleted'));
    } catch {
      showError(t('common.somethingWentWrong'));
    }
  }, [confirmDeleteId, deleteTeamMember, showSuccess, showError, t]);

  const renderRow = (item: GetTeamMemberResponse) => {
    const isMenuOpen = menuMemberId === item.id;
    const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ') || item.email;
    const shopLabel =
      item.shopNames.length === 0
        ? t('team.allShops')
        : item.shopNames.length <= 2
          ? item.shopNames.join(', ')
          : `${item.shopNames.slice(0, 2).join(', ')} +${item.shopNames.length - 2}`;

    return (
      <DataTable.Row key={item.id} style={styles.row}>
        <DataTable.Cell>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
            {fullName}
          </Text>
        </DataTable.Cell>

        <DataTable.Cell>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {item.email}
          </Text>
        </DataTable.Cell>

        <DataTable.Cell>
          <RoleBadge role={item.role} />
        </DataTable.Cell>

        <DataTable.Cell>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {shopLabel}
          </Text>
        </DataTable.Cell>

        <DataTable.Cell style={styles.actionsCell}>
          <Menu
            visible={isMenuOpen}
            onDismiss={() => setMenuMemberId(null)}
            contentStyle={{ backgroundColor: MENU_SURFACE }}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                iconColor={theme.colors.onSurface}
                onPress={() => setMenuMemberId(item.id)}
              />
            }
          >
            <Menu.Item onPress={() => handleEdit(item.id)} title={t('team.editMember')} />
            <Menu.Item
              onPress={() => {
                setMenuMemberId(null);
                setConfirmDeleteId(item.id);
              }}
              title={t('team.deleteMember')}
            />
          </Menu>
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  return (
    <SafeScreen noPadding>
      <AppHeader
        title={t('team.title')}
        rightAction={
          <HasPermission userRole={user?.role ?? null} permission={Permissions.UsersCreate}>
            <Button mode="contained" onPress={handleAdd} style={styles.addButton}>
              {t('team.addMember')}
            </Button>
          </HasPermission>
        }
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <DataTable style={styles.table}>
          <DataTable.Header style={styles.header}>
            <DataTable.Title>{t('team.name')}</DataTable.Title>
            <DataTable.Title>{t('team.email')}</DataTable.Title>
            <DataTable.Title>{t('team.role')}</DataTable.Title>
            <DataTable.Title>{t('team.shops')}</DataTable.Title>
            <DataTable.Title style={styles.actionsCell}>{''}</DataTable.Title>
          </DataTable.Header>

          {members.length === 0 ? (
            <View style={styles.centered}>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                {t('team.noMembers')}
              </Text>
            </View>
          ) : (
            <>
              {pageMembers.map(renderRow)}

              <DataTable.Pagination
                page={page}
                numberOfPages={Math.max(1, Math.ceil(members.length / itemsPerPage))}
                onPageChange={setPage}
                label={t('common.paginationLabel', {
                  from: from + 1,
                  to,
                  total: members.length,
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

      <DeleteConfirmDialog
        visible={confirmDeleteId !== null}
        title={t('team.deleteMember')}
        message={t('team.confirmDelete')}
        confirmLabel={t('team.deleteMember')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
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
