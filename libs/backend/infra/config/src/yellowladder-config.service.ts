import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed wrapper around `@nestjs/config`. Domain code reads env vars via
 * strongly-typed getters here rather than touching `process.env` directly.
 *
 * All defaults are intentionally permissive for local dev; production
 * deploys MUST set every JWT/Companies House secret explicitly.
 */
@Injectable()
export class YellowladderConfigService {
  constructor(private readonly config: ConfigService) {}

  // -------- Core --------

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  // -------- Database --------

  get databaseUrl(): string {
    return this.required('DATABASE_URL');
  }

  get databaseSystemUrl(): string | undefined {
    return this.config.get<string>('DATABASE_URL_SYSTEM');
  }

  // -------- JWT --------

  get jwtAccessSecret(): string {
    return this.required('JWT_ACCESS_SECRET');
  }

  get jwtAccessSecretPrevious(): string | undefined {
    return this.config.get<string>('JWT_ACCESS_SECRET_PREV');
  }

  get jwtRefreshSecret(): string {
    return this.required('JWT_REFRESH_SECRET');
  }

  get jwtRefreshSecretPrevious(): string | undefined {
    return this.config.get<string>('JWT_REFRESH_SECRET_PREV');
  }

  /** Access token TTL in seconds (default 300 = 5 minutes). */
  get jwtAccessTtlSeconds(): number {
    return Number(this.config.get<string>('JWT_ACCESS_TTL_SECONDS', '300'));
  }

  /** Refresh token TTL in seconds (default 604800 = 7 days). */
  get jwtRefreshTtlSeconds(): number {
    return Number(this.config.get<string>('JWT_REFRESH_TTL_SECONDS', '604800'));
  }

  // -------- Companies House --------

  get companiesHouseApiKey(): string | undefined {
    return this.config.get<string>('COMPANIES_HOUSE_API_KEY');
  }

  get companiesHouseBaseUrl(): string {
    return this.config.get<string>(
      'COMPANIES_HOUSE_BASE_URL',
      'https://api.company-information.service.gov.uk',
    );
  }

  // -------- CSRF / Origin allowlist --------

  get csrfAllowedOrigins(): readonly string[] {
    const raw = this.config.get<string>('CSRF_ALLOWED_ORIGINS', '');
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (this.isProduction && parsed.length === 0) {
      throw new Error(
        'CSRF_ALLOWED_ORIGINS must be set to a non-empty comma-separated list in production',
      );
    }
    return parsed;
  }

  // -------- CORS --------

  get corsOrigins(): readonly string[] {
    const raw = this.config.get<string>('CORS_ORIGINS', 'http://localhost:4200');
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // -------- HTTP listen --------

  get port(): number {
    return Number(this.config.get<string>('PORT', '3000'));
  }

  // -------- Throttler --------

  get throttleTtlSeconds(): number {
    return Number(this.config.get<string>('THROTTLE_TTL', '60'));
  }

  get throttleLimit(): number {
    return Number(this.config.get<string>('THROTTLE_LIMIT', '120'));
  }

  // -------- internal --------

  private required(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set.`);
    }
    return value;
  }
}
