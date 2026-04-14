import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { UserRole } from '@yellowladder/shared-types';
import { useTranslation } from 'react-i18next';
import { Chip } from 'react-native-paper';

export interface RoleBadgeProps {
  role: string;
}

/**
 * Small colored chip displaying the user's role label. Colors are derived
 * from the Paper theme tokens so they adapt to the Yellow Ladder brand.
 */
export function RoleBadge({ role }: RoleBadgeProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const config = getRoleConfig(role);

  return (
    <Chip
      mode="flat"
      compact
      textStyle={{
        fontSize: 12,
        color: config.textColor(theme),
      }}
      style={{
        backgroundColor: config.backgroundColor(theme),
        alignSelf: 'center',
      }}
    >
      {t(config.labelKey)}
    </Chip>
  );
}

interface RoleConfig {
  labelKey: string;
  backgroundColor: (theme: ReturnType<typeof useAppTheme>) => string;
  textColor: (theme: ReturnType<typeof useAppTheme>) => string;
}

function getRoleConfig(role: string): RoleConfig {
  switch (role) {
    case UserRole.SuperAdmin:
    case UserRole.CompanyAdmin:
      return {
        labelKey: 'team.roleAdmin',
        backgroundColor: (theme) => theme.colors.primaryContainer,
        textColor: (theme) => theme.colors.onPrimaryContainer,
      };
    case UserRole.ShopManager:
      return {
        labelKey: 'team.roleManager',
        backgroundColor: (theme) => theme.colors.tertiaryContainer,
        textColor: (theme) => theme.colors.onTertiaryContainer,
      };
    case UserRole.Employee:
      return {
        labelKey: 'team.roleClerk',
        backgroundColor: (theme) => theme.colors.secondaryContainer,
        textColor: (theme) => theme.colors.onSecondaryContainer,
      };
    default:
      return {
        labelKey: 'team.roleClerk',
        backgroundColor: (theme) => theme.colors.surfaceVariant,
        textColor: (theme) => theme.colors.onSurfaceVariant,
      };
  }
}
