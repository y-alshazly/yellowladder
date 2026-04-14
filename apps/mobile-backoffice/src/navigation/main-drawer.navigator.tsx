import { createDrawerNavigator } from '@react-navigation/drawer';
import { CatalogueScreen } from '@yellowladder/mobile-catalog';
import {
  KitchenPlaceholderScreen,
  PosPlaceholderScreen,
  ReportingPlaceholderScreen,
  TransactionsPlaceholderScreen,
} from '../screens/placeholder.screen';
import { CustomDrawerContent } from './custom-drawer-content.component';
import type { MainDrawerParamList } from './main.types';
import { SettingsStackNavigator } from './settings-stack.navigator';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

const DRAWER_WIDTH = 260;
const DRAWER_BG = '#141414';

/**
 * Slide-over drawer used on phones AND tablets. Always closed by default;
 * opened via the menu button in each screen's AppHeader.
 */
export function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: DRAWER_WIDTH, backgroundColor: DRAWER_BG },
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen name="PointOfSale" component={PosPlaceholderScreen} />
      <Drawer.Screen name="Kitchen" component={KitchenPlaceholderScreen} />
      <Drawer.Screen name="Transactions" component={TransactionsPlaceholderScreen} />
      <Drawer.Screen name="Catalogue" component={CatalogueScreen} />
      <Drawer.Screen name="Reporting" component={ReportingPlaceholderScreen} />
      <Drawer.Screen name="Settings" component={SettingsStackNavigator} />
    </Drawer.Navigator>
  );
}
