import { meetsRoleRequirement } from '@yellowladder/shared-mobile-ui';
import { selectCurrentUser, useAppSelector } from '@yellowladder/shared-store';
import { UserRole } from '@yellowladder/shared-types';
import { useMemo } from 'react';

export interface CataloguePermissions {
  canCreateCategory: boolean;
  canCreateItem: boolean;
  canEditItem: boolean;
  canDeleteItem: boolean;
}

/**
 * Memoized RBAC checks for the catalogue screen. Wraps the current role
 * requirements. Switching to the `HasPermission` component is step 9 and
 * out of scope for this refactor.
 */
export function useCataloguePermissions(): CataloguePermissions {
  const user = useAppSelector(selectCurrentUser);
  const role = user?.role ?? null;

  const canCreateCategory = useMemo(
    () => meetsRoleRequirement(role, UserRole.CompanyAdmin),
    [role],
  );
  const canCreateItem = useMemo(() => meetsRoleRequirement(role, UserRole.CompanyAdmin), [role]);
  const canEditItem = useMemo(() => meetsRoleRequirement(role, UserRole.ShopManager), [role]);
  const canDeleteItem = useMemo(() => meetsRoleRequirement(role, UserRole.CompanyAdmin), [role]);

  return { canCreateCategory, canCreateItem, canEditItem, canDeleteItem };
}
