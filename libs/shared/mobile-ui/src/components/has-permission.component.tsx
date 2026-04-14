import type { ReactNode } from 'react';
import { View } from 'react-native';
import { hasPermissionForRole } from '../hooks/use-has-permission.hook';

export interface HasPermissionProps {
  /** The current user's role, read from Redux by the parent. */
  userRole: string | null;
  /** The permission string to check (from `Permissions` constants). */
  permission: string;
  children: ReactNode;
  /**
   * When 'hide' (default), children are not rendered if the user lacks the
   * permission. When 'disable', children render with reduced opacity and are
   * non-interactive.
   */
  mode?: 'hide' | 'disable';
}

/**
 * Conditionally renders children based on a user's role-derived permission.
 *
 * Client-side gating is UX only -- it hides buttons the user cannot use; it
 * never grants access. The backend always re-checks the same permission via
 * `AuthorizationService.requirePermission()`.
 *
 * The parent component must pass `userRole` -- this component does NOT read
 * from Redux, keeping `shared-mobile-ui` free of `shared-store` dependencies.
 */
export function HasPermission({
  userRole,
  permission,
  children,
  mode = 'hide',
}: HasPermissionProps) {
  const allowed = hasPermissionForRole(userRole, permission);

  if (allowed) {
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
