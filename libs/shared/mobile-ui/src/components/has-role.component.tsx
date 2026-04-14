import type { UserRole } from '@yellowladder/shared-types';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { meetsRoleRequirement } from '../hooks/use-has-role.hook';

export interface HasRoleProps {
  /** The current user's role, read from the Redux store by the parent. */
  userRole: UserRole | null;
  /** The minimum role required to render children. */
  minimumRole: UserRole;
  children: ReactNode;
  /**
   * When 'hide' (default), children are not rendered if the user lacks the role.
   * When 'disable', children render with reduced opacity and are non-interactive.
   */
  mode?: 'hide' | 'disable';
}

/**
 * Conditionally renders children based on a user's role tier.
 * Use for navigation gating where granular permissions are not yet defined.
 *
 * The parent component must pass `userRole` — this component does NOT read
 * from Redux, keeping `shared-mobile-ui` free of `shared-store` dependencies.
 */
export function HasRole({ userRole, minimumRole, children, mode = 'hide' }: HasRoleProps) {
  const hasRole = meetsRoleRequirement(userRole, minimumRole);

  if (hasRole) {
    return children;
  }

  if (mode === 'disable') {
    return (
      <View style={{ opacity: 0.5 }} pointerEvents="none">
        {children}
      </View>
    );
  }

  return null;
}
