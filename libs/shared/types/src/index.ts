// Auth — constants
export { BusinessType } from './auth/business-type.constants';
export { OnboardingPhase } from './auth/onboarding-phase.constants';
export { OnboardingResumePoint } from './auth/onboarding-resume.constants';
export { OtpPurpose } from './auth/otp-purpose.constants';
export { Permissions, type Permission } from './auth/permissions.constants';
export { UserRole } from './auth/user-role.constants';
export { UserStatus } from './auth/user-status.constants';

// Auth — interfaces
export type { AuthTokens } from './auth/auth-tokens.interface';
export type { AuthenticatedUser } from './auth/authenticated-user.interface';
export type {
  CompaniesHouseAddress,
  CompaniesHouseLookupRequest,
  CompaniesHouseLookupResponse,
  CompaniesHousePersonOfSignificantControl,
  CompaniesHouseSearchRequest,
  CompaniesHouseSearchResponse,
  CompaniesHouseSearchResultItem,
} from './auth/companies-house.interface';
export type {
  AnnualTurnoverOption,
  BusinessCategoryOption,
  BusinessTypeOption,
  PaymentMethodPreferenceOption,
} from './auth/config-options.interface';
export type {
  CreateCompanyBusinessProfile,
  CreateCompanyRequest,
  CreateCompanyResponse,
  CreateCompanyResponseCompany,
  CreateCompanyResponseUser,
  LimitedCompanyDetails,
  PrimaryContactInput,
  SelfEmployedDetails,
} from './auth/create-company.interface';
export type { LoginRequest, LoginResponse } from './auth/login.interface';
export type {
  OtpRequestRequest,
  OtpRequestResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
} from './auth/otp.interface';
export type {
  PasswordResetCompleteRequest,
  PasswordResetCompleteResponse,
  PasswordResetInitiateRequest,
  PasswordResetInitiateResponse,
} from './auth/password-reset.interface';
export type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  UploadProfilePhotoResponse,
} from './auth/profile.interface';
export type { RefreshRequest, RefreshResponse } from './auth/refresh.interface';
export type { RegisterRequest, RegisterResponse } from './auth/register.interface';
export type { UserDeviceInfo, UserDeviceInfoInput } from './auth/user-device-info.interface';

// Events
export {
  IdentityEventTopic,
  type CompanyCreatedEventPayload,
  type EmailVerifiedEventPayload,
  type OtpRequestedEventPayload,
  type PasswordResetRequestedEventPayload,
  type UserRegisteredEventPayload,
} from './events/identity-events.interface';

// Errors
export {
  CompaniesHouseErrors,
  IdentityAuthenticationErrors,
  IdentityCompaniesErrors,
  IdentityUsersErrors,
  type CompaniesHouseError,
  type IdentityAuthenticationError,
  type IdentityCompaniesError,
  type IdentityUsersError,
} from './errors/error-codes.constants';
