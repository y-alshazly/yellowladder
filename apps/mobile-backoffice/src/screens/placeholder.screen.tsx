import { AppHeader, SafeScreen, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

interface PlaceholderScreenProps {
  titleKey: string;
  icon: string;
}

function PlaceholderScreen({ titleKey, icon }: PlaceholderScreenProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <SafeScreen noPadding>
      <AppHeader title={t(titleKey)} />
      <View style={[styles.container, { paddingHorizontal: theme.spacing.lg }]}>
        <Icon source={icon} size={48} color={theme.colors.onSurfaceVariant} />
        <Text
          variant="titleLarge"
          style={[styles.title, { color: theme.colors.onSurface, marginTop: theme.spacing.md }]}
        >
          {t('placeholder.title', { screen: t(titleKey) })}
        </Text>
        <Text
          variant="bodyMedium"
          style={[
            styles.body,
            { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm },
          ]}
        >
          {t('placeholder.body')}
        </Text>
      </View>
    </SafeScreen>
  );
}

export function PosPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.pointOfSale" icon="point-of-sale" />;
}

export function KitchenPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.kitchen" icon="chef-hat" />;
}

export function TransactionsPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.transactions" icon="swap-horizontal" />;
}

export function CataloguePlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.catalogue" icon="book-open-variant" />;
}

export function ReportingPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.reporting" icon="chart-bar" />;
}

export function MembersPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.settingsItems.members" icon="account-group" />;
}

export function GeneralPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.settingsItems.general" icon="cog" />;
}

export function SubscriptionsPlaceholderScreen() {
  return (
    <PlaceholderScreen titleKey="nav.settingsItems.subscriptions" icon="credit-card-outline" />
  );
}

export function TaxPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.settingsItems.tax" icon="percent" />;
}

export function DiscountsPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.settingsItems.discounts" icon="tag-outline" />;
}

export function IntegrationsPlaceholderScreen() {
  return <PlaceholderScreen titleKey="nav.settingsItems.integrations" icon="puzzle-outline" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
});
