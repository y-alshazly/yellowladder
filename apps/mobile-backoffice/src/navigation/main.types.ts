import type { NavigatorScreenParams } from '@react-navigation/native';

export type SettingsStackParamList = {
  Stores: undefined;
  AddStore: undefined;
  EditStore: { shopId: string };
  Members: undefined;
  MemberDetail: { memberId: string };
  AddMember: undefined;
  General: undefined;
  Subscriptions: undefined;
  Tax: undefined;
  Discounts: undefined;
  Integrations: undefined;
};

export type MainDrawerParamList = {
  PointOfSale: undefined;
  Kitchen: undefined;
  Transactions: undefined;
  Catalogue: undefined;
  Reporting: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};
