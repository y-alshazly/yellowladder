import type { AuthTokens } from './auth-tokens.interface';
import type { BusinessType } from './business-type.constants';
import type { CompaniesHouseAddress } from './companies-house.interface';

export interface PrimaryContactInput {
  source: 'PSC' | 'MANUAL';
  pscId?: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  phoneE164?: string;
  email?: string;
}

export interface LimitedCompanyDetails {
  businessType: 'LIMITED_COMPANY';
  registrationNumber: string;
  companyName: string;
  tradingName: string;
  registeredAddress: CompaniesHouseAddress;
  incorporationDate: string;
  primaryContact: PrimaryContactInput;
}

export interface SelfEmployedDetails {
  businessType: 'SELF_EMPLOYED';
  firstName: string;
  lastName: string;
  jobPosition: string;
  dateOfBirth: string;
  legalBusinessName: string;
  tradingName: string;
  registeredAddress: CompaniesHouseAddress;
  storeIsSameAddress: boolean;
}

export interface CreateCompanyBusinessProfile {
  businessCategoryId: string;
  paymentMethodPreferenceId: string;
  annualTurnoverBandId: string;
  vatRegistered: boolean;
  vatNumber?: string;
}

export interface CreateCompanyRequest {
  idempotencyKey: string;
  businessProfile: CreateCompanyBusinessProfile;
  details: LimitedCompanyDetails | SelfEmployedDetails;
  authorisationConfirmedAt: string;
}

export interface CreateCompanyResponseCompany {
  id: string;
  name: string;
  tradingName: string | null;
  businessType: BusinessType;
  createdAt: string;
}

export interface CreateCompanyResponseUser {
  id: string;
  companyId: string;
  role: 'COMPANY_ADMIN';
}

export interface CreateCompanyResponse {
  company: CreateCompanyResponseCompany;
  user: CreateCompanyResponseUser;
  tokens: AuthTokens;
}

export interface UpdateCompanyRequest {
  name?: string;
  tradingName?: string | null;
}
