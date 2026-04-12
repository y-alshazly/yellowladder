import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import {
  AuthenticationGuard,
  CurrentUser,
  Public,
  RequireOnboardingPhase,
} from '@yellowladder/backend-infra-auth';
import { YellowladderConfigService } from '@yellowladder/backend-infra-config';
import { BusinessException } from '@yellowladder/backend-infra-database';
import type {
  AuthTokens,
  AuthenticatedUser,
  LoginResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  PasswordResetCompleteResponse,
  PasswordResetInitiateResponse,
  RefreshResponse,
  RegisterResponse,
} from '@yellowladder/shared-types';
import { IdentityAuthenticationErrors, OnboardingPhase } from '@yellowladder/shared-types';
import type { Request, Response } from 'express';
import { AuthenticationService } from './authentication.service';
import { ApiAuthentication } from './authentication.swagger';
import { LoginRequestDto } from './dtos/login-request.dto';
import { OtpRequestRequestDto, OtpVerifyRequestDto } from './dtos/otp.dto';
import {
  PasswordResetCompleteRequestDto,
  PasswordResetInitiateRequestDto,
} from './dtos/password-reset.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';

const REFRESH_COOKIE_NAME = 'refresh_token';
const CSRF_COOKIE_NAME = 'csrf_token';
const CLIENT_PLATFORM_HEADER = 'x-client-platform';
const CLIENT_PLATFORM_MOBILE = 'mobile';

@ApiAuthentication()
@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly config: YellowladderConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Register — Phase A
  // ---------------------------------------------------------------------------
  @Post('register')
  @Public()
  @ApiAuthentication('register')
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @AuditLog({ action: 'Register', resource: 'User' })
  async register(
    @Body() dto: RegisterRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponse> {
    const outcome = await this.authenticationService.register(dto, {
      remoteIp: this.extractIp(req),
      userAgent: req.headers['user-agent'] ?? null,
    });
    this.setAuthCookies(
      res,
      req,
      outcome.rawRefreshToken,
      outcome.rawCsrfToken,
      outcome.refreshTokenExpiresAt,
    );
    return {
      user: outcome.user,
      tokens: this.stripRefreshForWeb(outcome.tokens, req),
      resumeAt: outcome.resumeAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  @Post('login')
  @Public()
  @ApiAuthentication('login')
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'Login', resource: 'User' })
  async login(
    @Body() dto: LoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const outcome = await this.authenticationService.login(dto, {
      remoteIp: this.extractIp(req),
      userAgent: req.headers['user-agent'] ?? null,
    });
    this.setAuthCookies(
      res,
      req,
      outcome.rawRefreshToken,
      outcome.rawCsrfToken,
      outcome.refreshTokenExpiresAt,
    );
    return {
      user: outcome.user,
      tokens: this.stripRefreshForWeb(outcome.tokens, req),
      resumeAt: outcome.resumeAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------
  @Post('refresh')
  @Public()
  @ApiAuthentication('refresh')
  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponse> {
    const rawRefreshToken = this.extractRefreshToken(req);
    const csrfToken = (req.headers['x-csrf-token'] as string | undefined) ?? '';
    this.assertOriginAllowed(req);
    const outcome = await this.authenticationService.refresh(rawRefreshToken, csrfToken, {
      remoteIp: this.extractIp(req),
      userAgent: req.headers['user-agent'] ?? null,
    });
    this.setAuthCookies(
      res,
      req,
      outcome.rawRefreshToken,
      outcome.rawCsrfToken,
      outcome.refreshTokenExpiresAt,
    );
    return { tokens: this.stripRefreshForWeb(outcome.tokens, req) };
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  @Post('logout')
  @UseGuards(AuthenticationGuard)
  @RequireOnboardingPhase(
    OnboardingPhase.PhaseARegistered,
    OnboardingPhase.PhaseBVerified,
    OnboardingPhase.PhaseCCompleted,
  )
  @ApiAuthentication('logout')
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'Logout', resource: 'User' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const rawRefreshToken = this.extractRefreshToken(req);
    await this.authenticationService.logout(rawRefreshToken);
    this.clearAuthCookies(res);
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // OTP request
  // ---------------------------------------------------------------------------
  @Post('otp/request')
  @UseGuards(AuthenticationGuard)
  @RequireOnboardingPhase(
    OnboardingPhase.PhaseARegistered,
    OnboardingPhase.PhaseBVerified,
    OnboardingPhase.PhaseCCompleted,
  )
  @ApiAuthentication('requestOtp')
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'RequestOtp', resource: 'OtpRecord' })
  async requestOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OtpRequestRequestDto,
  ): Promise<OtpRequestResponse> {
    return this.authenticationService.requestOtp(user, dto.email);
  }

  // ---------------------------------------------------------------------------
  // OTP verify — Phase B
  // ---------------------------------------------------------------------------
  @Post('otp/verify')
  @UseGuards(AuthenticationGuard)
  @RequireOnboardingPhase(
    OnboardingPhase.PhaseARegistered,
    OnboardingPhase.PhaseBVerified,
    OnboardingPhase.PhaseCCompleted,
  )
  @ApiAuthentication('verifyOtp')
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'VerifyOtp', resource: 'OtpRecord' })
  async verifyOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OtpVerifyRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OtpVerifyResponse> {
    if (dto.email.toLowerCase() !== user.email.toLowerCase()) {
      // Not a 401 — the user is authenticated; it's just a bad payload.
      throw new BusinessException(
        IdentityAuthenticationErrors.OtpEmailMismatch,
        'Email payload does not match authenticated user',
        HttpStatus.BAD_REQUEST,
      );
    }
    const outcome = await this.authenticationService.verifyOtp(user, dto.code, {
      remoteIp: this.extractIp(req),
      userAgent: req.headers['user-agent'] ?? null,
    });
    this.setAuthCookies(
      res,
      req,
      outcome.rawRefreshToken,
      outcome.rawCsrfToken,
      outcome.refreshTokenExpiresAt,
    );
    return {
      user: outcome.user,
      tokens: this.stripRefreshForWeb(outcome.tokens, req),
      resumeAt: outcome.resumeAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Password reset — initiate
  // ---------------------------------------------------------------------------
  @Post('password-reset/initiate')
  @Public()
  @ApiAuthentication('initiatePasswordReset')
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'InitiatePasswordReset', resource: 'User' })
  async initiatePasswordReset(
    @Body() dto: PasswordResetInitiateRequestDto,
  ): Promise<PasswordResetInitiateResponse> {
    return this.authenticationService.initiatePasswordReset(dto.email);
  }

  // ---------------------------------------------------------------------------
  // Password reset — complete
  // ---------------------------------------------------------------------------
  @Post('password-reset/complete')
  @Public()
  @ApiAuthentication('completePasswordReset')
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'CompletePasswordReset', resource: 'User' })
  async completePasswordReset(
    @Body() dto: PasswordResetCompleteRequestDto,
  ): Promise<PasswordResetCompleteResponse> {
    return this.authenticationService.completePasswordReset(dto.token, dto.newPassword);
  }

  // ---------------------------------------------------------------------------
  // internal helpers
  // ---------------------------------------------------------------------------

  private extractIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      const first = forwarded.split(',')[0];
      return first ? first.trim() : null;
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0] ?? null;
    }
    return req.ip ?? null;
  }

  private extractRefreshToken(req: Request): string {
    const cookieValue = req.cookies?.[REFRESH_COOKIE_NAME];
    if (cookieValue) {
      return cookieValue;
    }
    const header = req.headers['authorization'];
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return '';
  }

  private isMobileRequest(req: Request): boolean {
    const header = req.headers[CLIENT_PLATFORM_HEADER];
    if (typeof header === 'string') {
      return header.toLowerCase() === CLIENT_PLATFORM_MOBILE;
    }
    if (Array.isArray(header) && header.length > 0) {
      return (header[0] ?? '').toLowerCase() === CLIENT_PLATFORM_MOBILE;
    }
    return false;
  }

  private assertOriginAllowed(req: Request): void {
    const origin = (req.headers['origin'] as string | undefined) ?? '';
    const allowed = this.config.csrfAllowedOrigins;
    // Mobile clients do not send a browser Origin header and use the
    // `X-Client-Platform: mobile` opt-out. CSRF double-submit is a
    // browser-only defence — it does not apply to mobile requests.
    if (this.isMobileRequest(req)) {
      return;
    }
    if (allowed.length === 0) {
      // `YellowladderConfigService.csrfAllowedOrigins` throws in production
      // when empty, so reaching here means a non-production env. Allow.
      return;
    }
    if (!origin || !allowed.includes(origin)) {
      throw new BusinessException(
        IdentityAuthenticationErrors.CsrfOriginNotAllowed,
        'Origin not allowed',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Set the HttpOnly refresh + CSRF cookies on the response — WEB ONLY.
   * Mobile clients persist both values in `react-native-keychain` instead;
   * setting a cookie on a mobile response would result in both the cookie
   * AND the JSON body carrying the refresh token, violating architect §2.2
   * (the two storage modes must be mutually exclusive).
   */
  private setAuthCookies(
    res: Response,
    req: Request,
    refreshToken: string,
    csrfToken: string,
    expiresAt: Date,
  ): void {
    if (this.isMobileRequest(req)) {
      return;
    }
    const isProd = this.config.isProduction;
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/api/v1/auth',
      expires: expiresAt,
    });
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      expires: expiresAt,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
  }

  /**
   * Decide whether the `refreshToken` should ride in the JSON response body.
   *
   * - Web: strip — the refresh token lives only in the HttpOnly cookie.
   *   Mobile browsers must never see it in JS.
   * - Mobile: keep — the client persists it in `react-native-keychain` and
   *   sends it back via the `Authorization: Bearer ...` header on
   *   `/auth/refresh`.
   *
   * The mobile RTK Query client sets `X-Client-Platform: mobile` on every
   * request. Absent the header we default to web (safer), matching the
   * architect's intent.
   */
  private stripRefreshForWeb(tokens: AuthTokens, req: Request): AuthTokens {
    if (this.isMobileRequest(req)) {
      return tokens;
    }
    // Strip `refreshToken` from the body for web clients — it must live
    // only in the HttpOnly cookie.
    const stripped: AuthTokens = {
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      csrfToken: tokens.csrfToken,
    };
    return stripped;
  }
}
