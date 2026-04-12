/**
 * Flat permission strings in the form `{resource}:{action}`.
 * Declared as an `as const` object (no TypeScript enum per project rules).
 *
 * Resources are kebab-case plurals; actions are plain verbs.
 * Keep this list in sync with `RolePermissionRegistry` in
 * `backend-identity-authorization`.
 *
 * Feature 01 subset only — extended in later features.
 */
export const Permissions = {
  // Users (self-service)
  UsersReadSelf: 'users:read-self',
  UsersUpdateSelf: 'users:update-self',
  UsersChangePasswordSelf: 'users:change-password-self',
  UsersUploadPhotoSelf: 'users:upload-photo-self',

  // Companies (create during onboarding, read own)
  CompaniesCreate: 'companies:create',
  CompaniesRead: 'companies:read',
  CompaniesUpdate: 'companies:update',

  // Companies House proxy
  CompaniesHouseSearch: 'companies-house:search',
  CompaniesHouseLookup: 'companies-house:lookup',

  // Reference data (authenticated read)
  BusinessTypesRead: 'business-types:read',
  BusinessCategoriesRead: 'business-categories:read',
  AnnualTurnoverBandsRead: 'annual-turnover-bands:read',
  PaymentMethodsRead: 'payment-methods:read',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
