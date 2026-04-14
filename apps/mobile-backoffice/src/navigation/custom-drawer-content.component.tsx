import { useDrawerStatus, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerActions } from '@react-navigation/native';
import { clearRefreshToken } from '@yellowladder/mobile-identity';
import { useLogoutMutation } from '@yellowladder/shared-api';
import { markUnauthenticated, useAppDispatch } from '@yellowladder/shared-store';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';
import type { MainDrawerParamList, SettingsStackParamList } from './main.types';

const DRAWER_BG = '#141414';
const ICON_TILE_BG = '#2A2230';
const ICON_TILE_ACTIVE_BG = '#7A3FB5';
const ICON_COLOR = '#C9A8E8';
const TEXT_COLOR = '#FFFFFF';
const MUTED_COLOR = '#8A8A8A';
const DARK_RIPPLE = 'rgba(255,255,255,0.08)';
const ACTIVE_ROW_BG = '#2A2A2A';
const CLOSE_BUTTON_BG = '#141414';

interface DrawerItemConfig {
  name: keyof MainDrawerParamList;
  labelKey: string;
  icon: string;
}

const MAIN_ITEMS: readonly DrawerItemConfig[] = [
  { name: 'PointOfSale', labelKey: 'nav.pointOfSale', icon: 'point-of-sale' },
  { name: 'Kitchen', labelKey: 'nav.kitchen', icon: 'chef-hat' },
  { name: 'Transactions', labelKey: 'nav.transactions', icon: 'swap-horizontal' },
  { name: 'Catalogue', labelKey: 'nav.catalogue', icon: 'book-open-variant' },
  { name: 'Reporting', labelKey: 'nav.reporting', icon: 'chart-bar' },
] as const;

interface SettingsSubItemConfig {
  name: keyof SettingsStackParamList;
  labelKey: string;
}

const SETTINGS_SUB_ITEMS: readonly SettingsSubItemConfig[] = [
  { name: 'Members', labelKey: 'nav.settingsItems.members' },
  { name: 'Stores', labelKey: 'stores.title' },
  { name: 'Subscriptions', labelKey: 'nav.settingsItems.subscriptions' },
  { name: 'Tax', labelKey: 'nav.settingsItems.tax' },
  { name: 'Discounts', labelKey: 'nav.settingsItems.discounts' },
  { name: 'Integrations', labelKey: 'nav.settingsItems.integrations' },
] as const;

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation, state } = props;
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const activeRouteName = state.routes[state.index]?.name;

  const onSignOut = useCallback(async () => {
    try {
      await logout().unwrap();
    } catch {
      // Non-fatal — clear local state regardless
    }
    await clearRefreshToken();
    dispatch(markUnauthenticated());
  }, [logout, dispatch]);

  const closeDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.closeDrawer());
  }, [navigation]);

  return (
    <View style={styles.root}>
      <View style={[styles.drawer, { backgroundColor: DRAWER_BG }]}>
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {/* Main items */}
          {MAIN_ITEMS.map((item, index) => {
            const isActive = activeRouteName === item.name;
            return (
              <TouchableRipple
                key={`${item.name}-${index}`}
                onPress={() => navigation.navigate(item.name)}
                style={[styles.drawerItem, isActive && { backgroundColor: ACTIVE_ROW_BG }]}
                rippleColor={DARK_RIPPLE}
              >
                <View style={styles.drawerItemRow}>
                  <View
                    style={[
                      styles.iconTile,
                      { backgroundColor: isActive ? ICON_TILE_ACTIVE_BG : ICON_TILE_BG },
                    ]}
                  >
                    <Icon source={item.icon} size={16} color={ICON_COLOR} />
                  </View>
                  <Text variant="bodyLarge" style={[styles.drawerItemLabel, { color: TEXT_COLOR }]}>
                    {t(item.labelKey)}
                  </Text>
                </View>
              </TouchableRipple>
            );
          })}

          {/* Settings expandable section */}
          <TouchableRipple
            onPress={() => setSettingsExpanded((prev) => !prev)}
            style={[styles.drawerItem, settingsExpanded && { backgroundColor: ACTIVE_ROW_BG }]}
            rippleColor={DARK_RIPPLE}
          >
            <View style={styles.drawerItemRow}>
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: settingsExpanded ? ICON_TILE_ACTIVE_BG : ICON_TILE_BG },
                ]}
              >
                <Icon source="cog" size={16} color={ICON_COLOR} />
              </View>
              <Text
                variant="bodyLarge"
                style={[styles.drawerItemLabel, { color: TEXT_COLOR, flex: 1 }]}
              >
                {t('nav.settings')}
              </Text>
              <Icon
                source={settingsExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={MUTED_COLOR}
              />
            </View>
          </TouchableRipple>

          {settingsExpanded &&
            SETTINGS_SUB_ITEMS.map((sub) => {
              const isSubActive = activeRouteName === 'Settings';
              return (
                <TouchableRipple
                  key={sub.name}
                  onPress={() => navigation.navigate('Settings', { screen: sub.name })}
                  style={styles.subItem}
                  rippleColor={DARK_RIPPLE}
                >
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: isSubActive ? TEXT_COLOR : MUTED_COLOR,
                      fontWeight: '500',
                    }}
                  >
                    {t(sub.labelKey)}
                  </Text>
                </TouchableRipple>
              );
            })}
        </ScrollView>

        {/* Sign out pinned at bottom */}
        <TouchableRipple onPress={onSignOut} style={styles.signOut} rippleColor={DARK_RIPPLE}>
          <View style={styles.drawerItemRow}>
            <Icon source="logout" size={18} color={MUTED_COLOR} />
            <Text
              variant="bodyMedium"
              style={[styles.drawerItemLabel, { color: MUTED_COLOR, marginLeft: 12 }]}
            >
              {t('nav.signOut')}
            </Text>
          </View>
        </TouchableRipple>
      </View>

      {/* Close (X) button floating on the right edge — only while drawer is open */}
      {isDrawerOpen ? (
        <Pressable
          onPress={closeDrawer}
          accessibilityRole="button"
          accessibilityLabel="Close navigation"
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: CLOSE_BUTTON_BG, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Icon source="close" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const CLOSE_BUTTON_SIZE = 40;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingTop: 56,
    paddingBottom: 16,
  },
  drawerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  drawerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  drawerItemLabel: {
    fontWeight: '600',
  },
  subItem: {
    paddingLeft: 56,
    paddingVertical: 8,
  },
  signOut: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: -CLOSE_BUTTON_SIZE - 12,
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: CLOSE_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
