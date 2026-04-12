import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { YellowladderConfigService } from '@yellowladder/backend-infra-config';
import * as jwt from 'jsonwebtoken';
import type { JwtAccessTokenPayload, JwtRefreshTokenPayload } from './jwt-payload.interface';

/**
 * Dual-secret JWT issuer. Signs with the **current** secret, verifies against
 * **current** first and falls back to **previous** for rolling rotation
 * without a mass logout (architect §2.1).
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly config: YellowladderConfigService) {}

  signAccessToken(payload: Omit<JwtAccessTokenPayload, 'iat' | 'exp' | 'tokenType'>): {
    token: string;
    expiresAt: Date;
  } {
    const expiresInSeconds = this.config.jwtAccessTtlSeconds;
    const token = jwt.sign(
      { ...payload, tokenType: 'access' as const },
      this.config.jwtAccessSecret,
      { algorithm: 'HS256', expiresIn: expiresInSeconds },
    );
    return {
      token,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  signRefreshToken(payload: Omit<JwtRefreshTokenPayload, 'iat' | 'exp' | 'tokenType'>): {
    token: string;
    expiresAt: Date;
  } {
    const expiresInSeconds = this.config.jwtRefreshTtlSeconds;
    const token = jwt.sign(
      { ...payload, tokenType: 'refresh' as const },
      this.config.jwtRefreshSecret,
      { algorithm: 'HS256', expiresIn: expiresInSeconds },
    );
    return {
      token,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  verifyAccessToken(token: string): JwtAccessTokenPayload {
    return this.verifyWithDualSecret<JwtAccessTokenPayload>(
      token,
      this.config.jwtAccessSecret,
      this.config.jwtAccessSecretPrevious,
      'access',
    );
  }

  verifyRefreshToken(token: string): JwtRefreshTokenPayload {
    return this.verifyWithDualSecret<JwtRefreshTokenPayload>(
      token,
      this.config.jwtRefreshSecret,
      this.config.jwtRefreshSecretPrevious,
      'refresh',
    );
  }

  private verifyWithDualSecret<T extends { tokenType: string }>(
    token: string,
    current: string,
    previous: string | undefined,
    expectedType: 'access' | 'refresh',
  ): T {
    const tryVerify = (secret: string): T | null => {
      try {
        return jwt.verify(token, secret, { algorithms: ['HS256'] }) as T;
      } catch {
        return null;
      }
    };

    const decoded = tryVerify(current) ?? (previous ? tryVerify(previous) : null);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (decoded.tokenType !== expectedType) {
      throw new UnauthorizedException('Token type mismatch');
    }
    return decoded;
  }
}
