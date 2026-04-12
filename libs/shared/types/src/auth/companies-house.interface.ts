export interface CompaniesHouseSearchRequest {
  query: string;
  page?: number;
  pageSize?: number;
}

export interface CompaniesHouseSearchResultItem {
  registrationNumber: string;
  companyName: string;
  companyStatus: string;
  addressSnippet: string;
}

export interface CompaniesHouseSearchResponse {
  items: readonly CompaniesHouseSearchResultItem[];
  totalResults: number;
  page: number;
  pageSize: number;
}

export interface CompaniesHouseLookupRequest {
  registrationNumber: string;
}

export interface CompaniesHouseAddress {
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
}

export interface CompaniesHousePersonOfSignificantControl {
  id: string;
  name: string;
  kind: string;
  nationality: string | null;
  dateOfBirthYear: number | null;
  dateOfBirthMonth: number | null;
}

export interface CompaniesHouseLookupResponse {
  registrationNumber: string;
  companyName: string;
  companyStatus: string;
  companyType: string;
  incorporationDate: string;
  registeredAddress: CompaniesHouseAddress;
  sicCodes: readonly string[];
  personsOfSignificantControl: readonly CompaniesHousePersonOfSignificantControl[];
}
