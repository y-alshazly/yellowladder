import { Injectable, Logger } from '@nestjs/common';
import { YellowladderConfigService } from '@yellowladder/backend-infra-config';
import type {
  CompaniesHouseLookupResponse,
  CompaniesHousePersonOfSignificantControl,
  CompaniesHouseSearchResponse,
  CompaniesHouseSearchResultItem,
} from '@yellowladder/shared-types';
import {
  CompaniesHouseNotFoundException,
  CompaniesHouseRateLimitedException,
  CompaniesHouseUnavailableException,
} from './companies-house.errors';
import { LruTtlCache } from './lru-cache';

// Raw upstream shapes — captured here for the normaliser. We intentionally
// discard every field we do not surface to clients.
interface UpstreamSearchItem {
  title: string;
  company_number: string;
  company_status?: string;
  address_snippet?: string;
}

interface UpstreamSearchResponse {
  items?: UpstreamSearchItem[];
  total_results?: number;
}

interface UpstreamAddress {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

interface UpstreamCompanyProfile {
  company_number: string;
  company_name: string;
  company_status?: string;
  type?: string;
  date_of_creation?: string;
  registered_office_address?: UpstreamAddress;
  sic_codes?: string[];
}

interface UpstreamPsc {
  links?: { self?: string };
  name?: string;
  kind?: string;
  nationality?: string;
  date_of_birth?: { year?: number; month?: number };
}

interface UpstreamPscList {
  items?: UpstreamPsc[];
}

const DEFAULT_CACHE_CAPACITY = 256;
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
const CIRCUIT_OPEN_MS = 60 * 1000;

// Dev-mode stub data returned when no API key is configured
const DEV_STUB_COMPANIES: Record<
  string,
  { name: string; status: string; type: string; incorporationDate: string; sicCodes: string[] }
> = {
  '07228130': {
    name: 'TAPPD TECHNOLOGIES LTD',
    status: 'active',
    type: 'ltd',
    incorporationDate: '2010-04-12',
    sicCodes: ['62012'],
  },
  '00000001': {
    name: 'DEV TEST COMPANY LTD',
    status: 'active',
    type: 'ltd',
    incorporationDate: '2020-01-15',
    sicCodes: ['56101'],
  },
  '00000002': {
    name: 'ACME RESTAURANT GROUP LTD',
    status: 'active',
    type: 'ltd',
    incorporationDate: '2018-06-20',
    sicCodes: ['56101'],
  },
  '00000003': {
    name: 'LONDON EATS LTD',
    status: 'active',
    type: 'ltd',
    incorporationDate: '2019-03-10',
    sicCodes: ['56101'],
  },
  '00000004': {
    name: 'FRESH BITES PLC',
    status: 'active',
    type: 'ltd',
    incorporationDate: '2021-11-05',
    sicCodes: ['56101'],
  },
};

function buildDevSearchResponse(
  query: string,
  page: number,
  pageSize: number,
): CompaniesHouseSearchResponse {
  const lowerQuery = query.toLowerCase();
  const matches = Object.entries(DEV_STUB_COMPANIES)
    .filter(
      ([number, co]) => number.includes(lowerQuery) || co.name.toLowerCase().includes(lowerQuery),
    )
    .map(
      ([number, co]): CompaniesHouseSearchResultItem => ({
        registrationNumber: number,
        companyName: co.name,
        companyStatus: co.status,
        addressSnippet: '123 Dev Street, London, EC1A 1BB',
      }),
    );
  return {
    items: matches.slice((page - 1) * pageSize, page * pageSize),
    totalResults: matches.length,
    page,
    pageSize,
  };
}

function buildDevLookupResponse(registrationNumber: string): CompaniesHouseLookupResponse {
  const stub = DEV_STUB_COMPANIES[registrationNumber];
  if (!stub) {
    throw new CompaniesHouseNotFoundException();
  }
  return {
    registrationNumber,
    companyName: stub.name,
    companyStatus: stub.status,
    companyType: stub.type,
    incorporationDate: stub.incorporationDate,
    registeredAddress: {
      line1: '123 Dev Street',
      line2: null,
      city: 'London',
      region: 'Greater London',
      postalCode: 'EC1A 1BB',
      countryCode: 'GB',
    },
    sicCodes: stub.sicCodes,
    personsOfSignificantControl: [
      {
        id: `${registrationNumber}:dev-psc-1`,
        name: 'John Smith',
        kind: 'individual-person-with-significant-control',
        nationality: 'British',
        dateOfBirthYear: 1985,
        dateOfBirthMonth: 6,
      },
    ],
  };
}

@Injectable()
export class CompaniesHouseService {
  private readonly logger = new Logger(CompaniesHouseService.name);
  private readonly searchCache = new LruTtlCache<CompaniesHouseSearchResponse>(
    DEFAULT_CACHE_CAPACITY,
    DEFAULT_CACHE_TTL_MS,
  );
  private readonly lookupCache = new LruTtlCache<CompaniesHouseLookupResponse>(
    DEFAULT_CACHE_CAPACITY,
    DEFAULT_CACHE_TTL_MS,
  );
  private circuitOpenUntil = 0;

  constructor(private readonly config: YellowladderConfigService) {}

  private get isDevStubMode(): boolean {
    return this.config.isDevelopment && !this.config.companiesHouseApiKey;
  }

  async searchByName(
    query: string,
    page = 1,
    pageSize = 20,
  ): Promise<CompaniesHouseSearchResponse> {
    if (this.isDevStubMode) {
      this.logger.warn('Companies House: using dev stub data (no API key configured)');
      return buildDevSearchResponse(query, page, pageSize);
    }

    const cacheKey = `search:${query}:${page}:${pageSize}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    this.assertCircuitClosed();

    const startIndex = (page - 1) * pageSize;
    const url = new URL('/search/companies', this.config.companiesHouseBaseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('items_per_page', String(pageSize));
    url.searchParams.set('start_index', String(startIndex));

    const upstream = await this.fetchUpstream<UpstreamSearchResponse>(url.toString());
    const items: readonly CompaniesHouseSearchResultItem[] = (upstream.items ?? []).map(
      (item): CompaniesHouseSearchResultItem => ({
        registrationNumber: item.company_number,
        companyName: item.title,
        companyStatus: item.company_status ?? 'unknown',
        addressSnippet: item.address_snippet ?? '',
      }),
    );
    const response: CompaniesHouseSearchResponse = {
      items,
      totalResults: upstream.total_results ?? items.length,
      page,
      pageSize,
    };
    this.searchCache.set(cacheKey, response);
    return response;
  }

  async fetchByNumber(registrationNumber: string): Promise<CompaniesHouseLookupResponse> {
    if (this.isDevStubMode) {
      this.logger.warn('Companies House: using dev stub data (no API key configured)');
      return buildDevLookupResponse(registrationNumber);
    }

    const cacheKey = `lookup:${registrationNumber}`;
    const cached = this.lookupCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    this.assertCircuitClosed();

    const profileUrl = `${this.config.companiesHouseBaseUrl}/company/${encodeURIComponent(
      registrationNumber,
    )}`;
    const pscUrl = `${this.config.companiesHouseBaseUrl}/company/${encodeURIComponent(
      registrationNumber,
    )}/persons-with-significant-control`;

    const [profile, pscList] = await Promise.all([
      this.fetchUpstream<UpstreamCompanyProfile>(profileUrl),
      this.fetchUpstream<UpstreamPscList>(pscUrl, { allow404: true }),
    ]);

    const address = profile.registered_office_address ?? {};
    const psc: readonly CompaniesHousePersonOfSignificantControl[] = (pscList?.items ?? []).map(
      (p): CompaniesHousePersonOfSignificantControl => ({
        id: p.links?.self ?? `${registrationNumber}:${p.name ?? 'unknown'}`,
        name: p.name ?? 'Unknown',
        kind: p.kind ?? 'individual-person-with-significant-control',
        nationality: p.nationality ?? null,
        dateOfBirthYear: p.date_of_birth?.year ?? null,
        dateOfBirthMonth: p.date_of_birth?.month ?? null,
      }),
    );

    const response: CompaniesHouseLookupResponse = {
      registrationNumber: profile.company_number,
      companyName: profile.company_name,
      companyStatus: profile.company_status ?? 'unknown',
      companyType: profile.type ?? 'unknown',
      incorporationDate: profile.date_of_creation ?? '',
      registeredAddress: {
        line1: address.address_line_1 ?? '',
        line2: address.address_line_2 ?? null,
        city: address.locality ?? '',
        region: address.region ?? null,
        postalCode: address.postal_code ?? '',
        countryCode: address.country ?? 'GB',
      },
      sicCodes: profile.sic_codes ?? [],
      personsOfSignificantControl: psc,
    };
    this.lookupCache.set(cacheKey, response);
    return response;
  }

  // ---- internal ----

  private assertCircuitClosed(): void {
    if (Date.now() < this.circuitOpenUntil) {
      throw new CompaniesHouseRateLimitedException();
    }
  }

  private openCircuit(): void {
    this.circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
  }

  private async fetchUpstream<T>(url: string, options: { allow404?: boolean } = {}): Promise<T> {
    const apiKey = this.config.companiesHouseApiKey;
    if (!apiKey) {
      throw new CompaniesHouseUnavailableException('Companies House API key is not configured');
    }
    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      this.logger.error(`Companies House unreachable: ${(error as Error).message}`);
      throw new CompaniesHouseUnavailableException();
    }

    if (response.status === 404) {
      if (options.allow404) {
        return { items: [] } as T;
      }
      throw new CompaniesHouseNotFoundException();
    }

    if (response.status === 429) {
      this.logger.warn('Companies House upstream 429 — opening circuit for 60s');
      this.openCircuit();
      throw new CompaniesHouseRateLimitedException();
    }

    if (!response.ok) {
      this.logger.error(`Companies House HTTP ${response.status} on ${url}`);
      throw new CompaniesHouseUnavailableException();
    }

    return (await response.json()) as T;
  }
}
