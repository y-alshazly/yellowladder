import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddStoreScreen, EditStoreScreen, StoresListScreen } from '@yellowladder/mobile-catalog';
import {
  AddTeamMemberScreen,
  MemberDetailScreen,
  TeamMembersScreen,
} from '@yellowladder/mobile-identity';
import {
  DiscountsPlaceholderScreen,
  GeneralPlaceholderScreen,
  IntegrationsPlaceholderScreen,
  SubscriptionsPlaceholderScreen,
  TaxPlaceholderScreen,
} from '../screens/placeholder.screen';
import type { SettingsStackParamList } from './main.types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Stores"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Stores" component={StoresListScreen} />
      <Stack.Screen name="AddStore" component={AddStoreScreen} />
      <Stack.Screen name="EditStore" component={EditStoreScreen} />
      <Stack.Screen name="Members" component={TeamMembersScreen} />
      <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
      <Stack.Screen name="AddMember" component={AddTeamMemberScreen} />
      <Stack.Screen name="General" component={GeneralPlaceholderScreen} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsPlaceholderScreen} />
      <Stack.Screen name="Tax" component={TaxPlaceholderScreen} />
      <Stack.Screen name="Discounts" component={DiscountsPlaceholderScreen} />
      <Stack.Screen name="Integrations" component={IntegrationsPlaceholderScreen} />
    </Stack.Navigator>
  );
}
