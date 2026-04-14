/**
 * Domain-specific error codes per sub-module. Thrown by services via
 * `BusinessException` and serialised into API error responses.
 *
 * Feature 01–04 — extended by later features.
 */

export const IdentityAuthenticationErrors = {
  DuplicateEmail: 'IDENTITY.AUTHENTICATION.DUPLICATE_EMAIL',
  InvalidCredentials: 'IDENTITY.AUTHENTICATION.INVALID_CREDENTIALS',
  OtpInvalid: 'IDENTITY.AUTHENTICATION.OTP_INVALID',
  OtpExpired: 'IDENTITY.AUTHENTICATION.OTP_EXPIRED',
  OtpAttemptsExceeded: 'IDENTITY.AUTHENTICATION.OTP_ATTEMPTS_EXCEEDED',
  OtpRateLimited: 'IDENTITY.AUTHENTICATION.OTP_RATE_LIMITED',
  OtpEmailMismatch: 'IDENTITY.AUTHENTICATION.OTP_EMAIL_MISMATCH',
  RefreshTokenInvalid: 'IDENTITY.AUTHENTICATION.REFRESH_TOKEN_INVALID',
  RefreshTokenReused: 'IDENTITY.AUTHENTICATION.REFRESH_TOKEN_REUSED',
  CsrfTokenMissing: 'IDENTITY.AUTHENTICATION.CSRF_TOKEN_MISSING',
  CsrfTokenInvalid: 'IDENTITY.AUTHENTICATION.CSRF_TOKEN_INVALID',
  PasswordResetTokenInvalid: 'IDENTITY.AUTHENTICATION.PASSWORD_RESET_TOKEN_INVALID',
  PasswordResetTokenExpired: 'IDENTITY.AUTHENTICATION.PASSWORD_RESET_TOKEN_EXPIRED',
  CurrentPasswordIncorrect: 'IDENTITY.AUTHENTICATION.CURRENT_PASSWORD_INCORRECT',
  OnboardingPhaseForbidden: 'IDENTITY.AUTHENTICATION.ONBOARDING_PHASE_FORBIDDEN',
  CsrfOriginNotAllowed: 'IDENTITY.AUTHENTICATION.CSRF_ORIGIN_NOT_ALLOWED',
} as const;

export type IdentityAuthenticationError =
  (typeof IdentityAuthenticationErrors)[keyof typeof IdentityAuthenticationErrors];

export const IdentityUsersErrors = {
  UserNotFound: 'IDENTITY.USERS.USER_NOT_FOUND',
  ProfilePhotoNotSupported: 'IDENTITY.USERS.PROFILE_PHOTO_NOT_SUPPORTED',
  DuplicateEmail: 'IDENTITY.USERS.DUPLICATE_EMAIL',
  LastCompanyAdmin: 'IDENTITY.USERS.LAST_COMPANY_ADMIN',
  PrivilegeEscalation: 'IDENTITY.USERS.PRIVILEGE_ESCALATION',
  CannotDeleteSelf: 'IDENTITY.USERS.CANNOT_DELETE_SELF',
  UserAlreadyDeleted: 'IDENTITY.USERS.USER_ALREADY_DELETED',
  InvalidRoleAssignment: 'IDENTITY.USERS.INVALID_ROLE_ASSIGNMENT',
  ShopNotInCompany: 'IDENTITY.USERS.SHOP_NOT_IN_COMPANY',
  UserMustBelongToCompany: 'IDENTITY.USERS.USER_MUST_BELONG_TO_COMPANY',
} as const;

export type IdentityUsersError = (typeof IdentityUsersErrors)[keyof typeof IdentityUsersErrors];

export const IdentityCompaniesErrors = {
  CompanyAlreadyExists: 'IDENTITY.COMPANIES.COMPANY_ALREADY_EXISTS',
  CompanyNotFound: 'IDENTITY.COMPANIES.COMPANY_NOT_FOUND',
  BusinessCategoryNotFound: 'IDENTITY.COMPANIES.BUSINESS_CATEGORY_NOT_FOUND',
  BusinessTypeNotFound: 'IDENTITY.COMPANIES.BUSINESS_TYPE_NOT_FOUND',
  PaymentMethodNotFound: 'IDENTITY.COMPANIES.PAYMENT_METHOD_NOT_FOUND',
  AnnualTurnoverBandNotFound: 'IDENTITY.COMPANIES.ANNUAL_TURNOVER_BAND_NOT_FOUND',
  UserAlreadyHasCompany: 'IDENTITY.COMPANIES.USER_ALREADY_HAS_COMPANY',
  EmailNotVerified: 'IDENTITY.COMPANIES.EMAIL_NOT_VERIFIED',
} as const;

export type IdentityCompaniesError =
  (typeof IdentityCompaniesErrors)[keyof typeof IdentityCompaniesErrors];

export const CompaniesHouseErrors = {
  Unavailable: 'COMPANIES_HOUSE.UNAVAILABLE',
  NotFound: 'COMPANIES_HOUSE.NOT_FOUND',
  RateLimited: 'COMPANIES_HOUSE.RATE_LIMITED',
  InvalidRegistrationNumber: 'COMPANIES_HOUSE.INVALID_REGISTRATION_NUMBER',
} as const;

export type CompaniesHouseError = (typeof CompaniesHouseErrors)[keyof typeof CompaniesHouseErrors];

export const CatalogShopsErrors = {
  ShopNotFound: 'CATALOG.SHOPS.SHOP_NOT_FOUND',
  ShopAlreadyArchived: 'CATALOG.SHOPS.SHOP_ALREADY_ARCHIVED',
  ShopNotArchived: 'CATALOG.SHOPS.SHOP_NOT_ARCHIVED',
  CannotArchiveMainShop: 'CATALOG.SHOPS.CANNOT_ARCHIVE_MAIN_SHOP',
  MainShopAlreadyExists: 'CATALOG.SHOPS.MAIN_SHOP_ALREADY_EXISTS',
  InvalidReorderList: 'CATALOG.SHOPS.INVALID_REORDER_LIST',
  CompanyRequired: 'CATALOG.SHOPS.COMPANY_REQUIRED',
} as const;

export type CatalogShopsError = (typeof CatalogShopsErrors)[keyof typeof CatalogShopsErrors];

export const CatalogCategoriesErrors = {
  CategoryNotFound: 'CATALOG.CATEGORIES.CATEGORY_NOT_FOUND',
  NameAlreadyExists: 'CATALOG.CATEGORIES.NAME_ALREADY_EXISTS',
  InvalidReorderList: 'CATALOG.CATEGORIES.INVALID_REORDER_LIST',
  HasMenuItems: 'CATALOG.CATEGORIES.HAS_MENU_ITEMS',
} as const;

export type CatalogCategoriesError =
  (typeof CatalogCategoriesErrors)[keyof typeof CatalogCategoriesErrors];

export const CatalogMenuItemsErrors = {
  MenuItemNotFound: 'CATALOG.MENU_ITEMS.MENU_ITEM_NOT_FOUND',
  CategoryNotFound: 'CATALOG.MENU_ITEMS.CATEGORY_NOT_FOUND',
  NameAlreadyExists: 'CATALOG.MENU_ITEMS.NAME_ALREADY_EXISTS',
} as const;

export type CatalogMenuItemsError =
  (typeof CatalogMenuItemsErrors)[keyof typeof CatalogMenuItemsErrors];

export const CatalogMenuAddonsErrors = {
  MenuAddonNotFound: 'CATALOG.MENU_ADDONS.MENU_ADDON_NOT_FOUND',
  MenuAddonOptionNotFound: 'CATALOG.MENU_ADDONS.MENU_ADDON_OPTION_NOT_FOUND',
  MenuItemNotFound: 'CATALOG.MENU_ADDONS.MENU_ITEM_NOT_FOUND',
} as const;

export type CatalogMenuAddonsError =
  (typeof CatalogMenuAddonsErrors)[keyof typeof CatalogMenuAddonsErrors];

export const CatalogShopOverridesErrors = {
  ShopCategoryNotFound: 'CATALOG.SHOP_OVERRIDES.SHOP_CATEGORY_NOT_FOUND',
  ShopMenuItemNotFound: 'CATALOG.SHOP_OVERRIDES.SHOP_MENU_ITEM_NOT_FOUND',
  ShopMenuAddonNotFound: 'CATALOG.SHOP_OVERRIDES.SHOP_MENU_ADDON_NOT_FOUND',
  ShopMenuAddonOptionNotFound: 'CATALOG.SHOP_OVERRIDES.SHOP_MENU_ADDON_OPTION_NOT_FOUND',
} as const;

export type CatalogShopOverridesError =
  (typeof CatalogShopOverridesErrors)[keyof typeof CatalogShopOverridesErrors];
