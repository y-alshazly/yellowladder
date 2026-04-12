/**
 * Domain-specific error codes per sub-module. Thrown by services via
 * `BusinessException` and serialised into API error responses.
 *
 * Feature 01 subset — extended by later features.
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
