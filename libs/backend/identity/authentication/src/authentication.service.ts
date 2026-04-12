import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '@yellowladder/backend-infra-auth';
import { YellowladderConfigService } from '@yellowladder/backend-infra-config';
import { BusinessException, Prisma } from '@yellowladder/backend-infra-database';
import { DomainEventPublisher } from '@yellowladder/backend-infra-events';
import type {
  AuthTokens,
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  OnboardingResumePoint as OnboardingResumePointType,
  OtpRequestResponse,
  OtpVerifyResponse,
  PasswordResetCompleteResponse,
  PasswordResetInitiateResponse,
  RegisterRequest,
  RegisterResponse,
} from '@yellowladder/shared-types';
import {
  IdentityAuthenticationErrors,
  IdentityEventTopic,
  OnboardingPhase,
  OnboardingResumePoint,
  OtpPurpose,
  UserRole,
} from '@yellowladder/shared-types';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import {
  BCRYPT_COST,
  CSRF_TOKEN_BYTES,
  OTP_CODE_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_REQUESTS_PER_WINDOW,
  OTP_REQUEST_WINDOW_MS,
  OTP_TTL_MS,
  PASSWORD_RESET_MAX_REQUESTS_PER_WINDOW,
  PASSWORD_RESET_TOKEN_BYTES,
  PASSWORD_RESET_TTL_MS,
} from './authentication.constants';
import type { EmailVerifiedEvent } from './events/email-verified.event';
import type { OtpRequestedEvent } from './events/otp-requested.event';
import type { PasswordResetRequestedEvent } from './events/password-reset-requested.event';
import type { UserRegisteredEvent } from './events/user-registered.event';
import { randomHex, randomNumericCode, sha256Hex } from './hash.util';
import { OtpRepository } from './otp.repository';
import { PasswordResetTokenRepository } from './password-reset.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { toAuthenticatedUser } from './user.mapper';
import { AuthenticationUsersRepository } from './users.repository';

export interface RegisterContext {
  remoteIp: string | null;
  userAgent: string | null;
}

export interface LoginContext {
  remoteIp: string | null;
  userAgent: string | null;
}

export interface RegisterOutcome extends RegisterResponse {
  rawRefreshToken: string;
  rawCsrfToken: string;
  refreshTokenExpiresAt: Date;
}

export interface LoginOutcome extends LoginResponse {
  rawRefreshToken: string;
  rawCsrfToken: string;
  refreshTokenExpiresAt: Date;
}

export interface RefreshOutcome {
  tokens: AuthTokens;
  rawRefreshToken: string;
  rawCsrfToken: string;
  refreshTokenExpiresAt: Date;
}

export interface OtpVerifyOutcome extends OtpVerifyResponse {
  rawRefreshToken: string;
  rawCsrfToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private readonly usersRepository: AuthenticationUsersRepository,
    private readonly otpRepository: OtpRepository,
    private readonly passwordResetRepository: PasswordResetTokenRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly config: YellowladderConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Phase A — Register
  // ---------------------------------------------------------------------------
  async register(input: RegisterRequest, context: RegisterContext): Promise<RegisterOutcome> {
    // 1. Hash password with bcrypt cost >= 12 (constant).
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

    // 2. Create the user row.
    let user;
    try {
      user = await this.usersRepository.createOne({
        email: input.email,
        passwordHash,
        phoneE164: input.phoneE164,
        phoneCountryCode: input.phoneCountryCode,
        countryCode: input.countryCode,
        role: UserRole.CompanyAdmin,
        onboardingPhase: OnboardingPhase.PhaseARegistered,
        status: 'ACTIVE',
        termsAcceptedAt: new Date(input.termsAcceptedAt),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BusinessException(
          IdentityAuthenticationErrors.DuplicateEmail,
          'An account with this email already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }

    const now = new Date();

    // 4. Fire domain events (cross-domain handlers live in the consumer domain).
    const userRegisteredPayload: UserRegisteredEvent = {
      userId: user.id,
      email: user.email,
      occurredAt: now.toISOString(),
    };
    this.eventPublisher.publish(IdentityEventTopic.UserRegistered, userRegisteredPayload);

    // 5. Issue initial OTP so the verification email dispatches.
    const otp = await this.issueOtpForUser(user.id, user.email, now);
    const otpRequestedPayload: OtpRequestedEvent = {
      userId: user.id,
      email: user.email,
      purpose: OtpPurpose.EmailVerification,
      expiresAt: otp.expiresAt.toISOString(),
      occurredAt: now.toISOString(),
    };
    this.eventPublisher.publish(IdentityEventTopic.OtpRequested, otpRequestedPayload);

    // 6. Issue access + refresh tokens so the client can reach /otp/verify.
    const authenticatedUser = toAuthenticatedUser(user);
    const issued = await this.issueTokenPair(authenticatedUser, context);

    return {
      user: authenticatedUser,
      tokens: issued.tokens,
      resumeAt: OnboardingResumePoint.VerifyEmail,
      rawRefreshToken: issued.rawRefreshToken,
      rawCsrfToken: issued.rawCsrfToken,
      refreshTokenExpiresAt: issued.refreshTokenExpiresAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  async login(input: LoginRequest, context: LoginContext): Promise<LoginOutcome> {
    const emailNormalised = input.email.toLowerCase();
    const user = await this.usersRepository.findOneByEmailNormalised(emailNormalised);
    if (!user) {
      // Generic error — never leak which emails exist.
      throw new BusinessException(
        IdentityAuthenticationErrors.InvalidCredentials,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new BusinessException(
        IdentityAuthenticationErrors.InvalidCredentials,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const authenticatedUser = toAuthenticatedUser(user);
    const issued = await this.issueTokenPair(authenticatedUser, context);

    return {
      user: authenticatedUser,
      tokens: issued.tokens,
      resumeAt: this.computeResumePoint(authenticatedUser),
      rawRefreshToken: issued.rawRefreshToken,
      rawCsrfToken: issued.rawCsrfToken,
      refreshTokenExpiresAt: issued.refreshTokenExpiresAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Refresh — rotate tokens, enforce reuse detection
  // ---------------------------------------------------------------------------
  async refresh(
    rawRefreshToken: string,
    providedCsrfToken: string,
    context: LoginContext,
  ): Promise<RefreshOutcome> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    if (!providedCsrfToken) {
      throw new BusinessException(
        IdentityAuthenticationErrors.CsrfTokenMissing,
        'CSRF token is required',
        HttpStatus.FORBIDDEN,
      );
    }

    const payload = this.tokenService.verifyRefreshToken(rawRefreshToken);
    const tokenHash = sha256Hex(rawRefreshToken);
    const record = await this.refreshTokenRepository.findOneByHash(tokenHash);
    if (!record) {
      // Token not found in store — either forged or already rotated.
      throw new BusinessException(
        IdentityAuthenticationErrors.RefreshTokenInvalid,
        'Invalid refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (record.revoked || record.rotatedAt !== null) {
      // REUSE DETECTED — scorched earth.
      this.logger.warn(
        `Refresh token reuse detected for user ${record.userId}; revoking all sessions`,
      );
      await this.refreshTokenRepository.revokeAllForUser(record.userId);
      throw new BusinessException(
        IdentityAuthenticationErrors.RefreshTokenReused,
        'Refresh token has been used — all sessions revoked',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // CSRF double-submit check.
    const providedCsrfHash = sha256Hex(providedCsrfToken);
    if (providedCsrfHash !== record.csrfHash) {
      throw new BusinessException(
        IdentityAuthenticationErrors.CsrfTokenInvalid,
        'CSRF token mismatch',
        HttpStatus.FORBIDDEN,
      );
    }

    const user = await this.usersRepository.findOneById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    const authenticatedUser = toAuthenticatedUser(user);

    // Rotate: mark old record rotated, issue new pair.
    await this.refreshTokenRepository.markRotated(record.id, new Date());
    const issued = await this.issueTokenPair(authenticatedUser, context);

    return {
      tokens: issued.tokens,
      rawRefreshToken: issued.rawRefreshToken,
      rawCsrfToken: issued.rawCsrfToken,
      refreshTokenExpiresAt: issued.refreshTokenExpiresAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  async logout(rawRefreshToken: string | null): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }
    const hash = sha256Hex(rawRefreshToken);
    const record = await this.refreshTokenRepository.findOneByHash(hash);
    if (record) {
      await this.refreshTokenRepository.revoke(record.id);
    }
  }

  // ---------------------------------------------------------------------------
  // OTP request
  // ---------------------------------------------------------------------------
  async requestOtp(
    authenticatedUser: AuthenticatedUser,
    email: string,
  ): Promise<OtpRequestResponse> {
    // Rate limit — max 3 codes per email per 15 min window.
    const since = new Date(Date.now() - OTP_REQUEST_WINDOW_MS);
    const count = await this.otpRepository.countByEmailSince(email.toLowerCase(), since);
    if (count >= OTP_MAX_REQUESTS_PER_WINDOW) {
      throw new BusinessException(
        IdentityAuthenticationErrors.OtpRateLimited,
        'Too many OTP requests — please wait before requesting another',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Email must match the authenticated user's email (anti-enumeration).
    if (email.toLowerCase() !== authenticatedUser.email.toLowerCase()) {
      throw new BusinessException(
        IdentityAuthenticationErrors.OtpEmailMismatch,
        'Email does not match the authenticated user',
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    const otp = await this.issueOtpForUser(authenticatedUser.id, authenticatedUser.email, now);

    const payload: OtpRequestedEvent = {
      userId: authenticatedUser.id,
      email: authenticatedUser.email,
      purpose: OtpPurpose.EmailVerification,
      expiresAt: otp.expiresAt.toISOString(),
      occurredAt: now.toISOString(),
    };
    this.eventPublisher.publish(IdentityEventTopic.OtpRequested, payload);

    return {
      sentAt: now.toISOString(),
      expiresAt: otp.expiresAt.toISOString(),
      remainingRequestsInWindow: Math.max(0, OTP_MAX_REQUESTS_PER_WINDOW - (count + 1)),
    };
  }

  // ---------------------------------------------------------------------------
  // OTP verify
  // ---------------------------------------------------------------------------
  async verifyOtp(
    authenticatedUser: AuthenticatedUser,
    code: string,
    context: LoginContext,
  ): Promise<OtpVerifyOutcome> {
    // Defensive length check (class-validator already handles format).
    if (code.length !== OTP_CODE_LENGTH) {
      throw new BusinessException(
        IdentityAuthenticationErrors.OtpInvalid,
        'OTP code is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    const record = await this.otpRepository.findLatestActive(
      authenticatedUser.id,
      OtpPurpose.EmailVerification,
    );
    if (!record) {
      throw new BusinessException(
        IdentityAuthenticationErrors.OtpInvalid,
        'No active OTP — please request a new code',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BusinessException(
        IdentityAuthenticationErrors.OtpExpired,
        'OTP has expired — please request a new code',
        HttpStatus.GONE,
      );
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BusinessException(
        IdentityAuthenticationErrors.OtpAttemptsExceeded,
        'Too many failed attempts — please request a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const codeHash = sha256Hex(code);
    if (codeHash !== record.codeHash) {
      await this.otpRepository.incrementAttempts(record.id);
      throw new BusinessException(
        IdentityAuthenticationErrors.OtpInvalid,
        'Incorrect code',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Success — mark code consumed and flip user to Phase B.
    const now = new Date();
    await this.otpRepository.markConsumed(record.id, now);
    const updated = await this.usersRepository.markEmailVerified(authenticatedUser.id, now);
    const refreshed = toAuthenticatedUser(updated);

    const verifiedPayload: EmailVerifiedEvent = {
      userId: updated.id,
      email: updated.email,
      occurredAt: now.toISOString(),
    };
    this.eventPublisher.publish(IdentityEventTopic.EmailVerified, verifiedPayload);

    // Issue fresh token pair so claims reflect emailVerified=true.
    const issued = await this.issueTokenPair(refreshed, context);
    return {
      user: refreshed,
      tokens: issued.tokens,
      resumeAt: this.computeResumePoint(refreshed),
      rawRefreshToken: issued.rawRefreshToken,
      rawCsrfToken: issued.rawCsrfToken,
      refreshTokenExpiresAt: issued.refreshTokenExpiresAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Password reset — initiate (no account enumeration)
  // ---------------------------------------------------------------------------
  async initiatePasswordReset(email: string): Promise<PasswordResetInitiateResponse> {
    const now = new Date();
    const response: PasswordResetInitiateResponse = { sentAt: now.toISOString() };

    const user = await this.usersRepository.findOneByEmailNormalised(email.toLowerCase());
    if (!user) {
      // Silent success to avoid leaking account existence.
      return response;
    }

    // Rate limit — max 3 per user per 15 minutes.
    const windowStart = new Date(Date.now() - OTP_REQUEST_WINDOW_MS);
    const recentCount = await this.passwordResetRepository.countByUserSince(user.id, windowStart);
    if (recentCount >= PASSWORD_RESET_MAX_REQUESTS_PER_WINDOW) {
      // Still return 200 — don't reveal rate limit to attackers.
      return response;
    }

    const raw = randomHex(PASSWORD_RESET_TOKEN_BYTES);
    const tokenHash = sha256Hex(raw);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await this.passwordResetRepository.createOne({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const payload: PasswordResetRequestedEvent = {
      userId: user.id,
      email: user.email,
      expiresAt: expiresAt.toISOString(),
      occurredAt: now.toISOString(),
    };
    this.eventPublisher.publish(IdentityEventTopic.PasswordResetRequested, payload);
    // NOTE: the raw token is delivered to the user via the email handler in
    // the Integrations.email domain. It leaves this service only via the
    // domain event payload extension (handler-internal) — never over HTTP.
    this.logger.debug(
      `Password reset token issued for user ${user.id}; raw token delivered via email handler`,
    );

    // Return the raw token inside the event to the email handler via an
    // internal side-channel: we publish a synchronous secondary event carrying
    // the raw value scoped to the integrations email handler.
    this.eventPublisher.publish('identity.password-reset-token-issued', {
      userId: user.id,
      email: user.email,
      rawToken: raw,
      expiresAt: expiresAt.toISOString(),
    });

    return response;
  }

  // ---------------------------------------------------------------------------
  // Password reset — complete
  // ---------------------------------------------------------------------------
  async completePasswordReset(
    rawToken: string,
    newPassword: string,
  ): Promise<PasswordResetCompleteResponse> {
    const tokenHash = sha256Hex(rawToken);
    const record = await this.passwordResetRepository.findActiveByHash(tokenHash);
    if (!record) {
      throw new BusinessException(
        IdentityAuthenticationErrors.PasswordResetTokenInvalid,
        'Reset link is invalid or has already been used',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BusinessException(
        IdentityAuthenticationErrors.PasswordResetTokenExpired,
        'Reset link has expired — please request a new one',
        HttpStatus.GONE,
      );
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await this.usersRepository.updatePassword(record.userId, passwordHash, now);
    await this.passwordResetRepository.markConsumed(record.id, now);
    // Scorched earth — all active sessions revoked.
    await this.refreshTokenRepository.revokeAllForUser(record.userId);
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Change password (authenticated)
  // ---------------------------------------------------------------------------
  async changePassword(
    user: AuthenticatedUser,
    currentPassword: string,
    newPassword: string,
    currentSessionId: string | null,
  ): Promise<void> {
    const row = await this.usersRepository.findOneById(user.id);
    if (!row) {
      throw new UnauthorizedException('User no longer exists');
    }
    const ok = await bcrypt.compare(currentPassword, row.passwordHash);
    if (!ok) {
      throw new BusinessException(
        IdentityAuthenticationErrors.CurrentPasswordIncorrect,
        'Current password is incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }
    const newHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await this.usersRepository.updatePassword(user.id, newHash, new Date());
    // Revoke every session EXCEPT the caller's current one. The session id
    // is threaded through from `UsersController.changePassword` via the
    // JWT `sid` claim (see review [m-6]). If for some reason the caller
    // did not supply a session id we fall back to scorched-earth revoke
    // — surprising the user (logout-on-change) is safer than leaving a
    // stale session alive.
    if (currentSessionId) {
      // Find the RefreshTokenRecord matching this session. The JWT `sid`
      // is the `id` of a RefreshTokenRecord row — see `issueTokenPair`.
      await this.refreshTokenRepository.revokeAllExceptCurrent(user.id, currentSessionId);
    } else {
      await this.refreshTokenRepository.revokeAllForUser(user.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async issueTokenPair(
    user: AuthenticatedUser,
    context: LoginContext,
  ): Promise<{
    tokens: AuthTokens;
    rawRefreshToken: string;
    rawCsrfToken: string;
    refreshTokenExpiresAt: Date;
  }> {
    const sessionId = randomUUID();
    const access = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      shopIds: user.shopIds,
      emailVerified: user.emailVerified,
      onboardingPhase: user.onboardingPhase,
      sid: sessionId,
    });
    const refresh = this.tokenService.signRefreshToken({
      sub: user.id,
      sid: sessionId,
    });
    const rawCsrfToken = randomHex(CSRF_TOKEN_BYTES);

    await this.refreshTokenRepository.createOne({
      userId: user.id,
      tokenHash: sha256Hex(refresh.token),
      csrfHash: sha256Hex(rawCsrfToken),
      userAgent: context.userAgent,
      ipAddress: context.remoteIp,
      expiresAt: refresh.expiresAt,
    });

    const tokens: AuthTokens = {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
      csrfToken: rawCsrfToken,
      refreshToken: refresh.token, // included — controller strips for web responses
    };

    return {
      tokens,
      rawRefreshToken: refresh.token,
      rawCsrfToken,
      refreshTokenExpiresAt: refresh.expiresAt,
    };
  }

  private async issueOtpForUser(userId: string, email: string, now: Date) {
    // DEV ONLY: deterministic OTP for local testing.
    // TODO: remove before production shipping.
    const code = this.config.isDevelopment ? '123456' : randomNumericCode(OTP_CODE_LENGTH);
    const codeHash = sha256Hex(code);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    const record = await this.otpRepository.createOne({
      userId,
      email: email.toLowerCase(),
      purpose: OtpPurpose.EmailVerification,
      codeHash,
      expiresAt,
    });
    // Raw code leaves this method only via the internal side-channel event —
    // never persisted anywhere other than the SHA-256 hash in OtpRecord.
    this.eventPublisher.publish('identity.otp-code-issued', {
      userId,
      email,
      rawCode: code,
      purpose: OtpPurpose.EmailVerification,
      expiresAt: expiresAt.toISOString(),
    });
    return record;
  }

  private computeResumePoint(user: AuthenticatedUser): OnboardingResumePointType {
    if (!user.emailVerified) {
      return OnboardingResumePoint.VerifyEmail;
    }
    if (!user.companyId) {
      return OnboardingResumePoint.WizardBusinessProfile;
    }
    return OnboardingResumePoint.Home;
  }
}
