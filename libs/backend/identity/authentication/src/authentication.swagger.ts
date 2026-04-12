import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type AuthMethod =
  | 'register'
  | 'login'
  | 'refresh'
  | 'logout'
  | 'requestOtp'
  | 'verifyOtp'
  | 'initiatePasswordReset'
  | 'completePasswordReset';

const methodDecorators: Record<AuthMethod, () => MethodDecorator> = {
  register: () =>
    applyDecorators(
      ApiOperation({ summary: 'Register a new merchant account (Phase A)' }),
      ApiResponse({ status: 201, description: 'Account created; OTP email sent' }),
      ApiResponse({ status: 409, description: 'Duplicate email' }),
      ApiResponse({ status: 400, description: 'Validation failed' }),
      ApiResponse({ status: 429, description: 'Rate limited' }),
    ),
  login: () =>
    applyDecorators(
      ApiOperation({ summary: 'Authenticate with email + password' }),
      ApiResponse({ status: 200, description: 'Tokens issued + resume hint' }),
      ApiResponse({ status: 401, description: 'Invalid credentials' }),
    ),
  refresh: () =>
    applyDecorators(
      ApiOperation({ summary: 'Rotate refresh and access tokens' }),
      ApiResponse({ status: 200, description: 'Fresh token pair' }),
      ApiResponse({ status: 401, description: 'Invalid or reused token' }),
      ApiResponse({ status: 403, description: 'CSRF check failed' }),
    ),
  logout: () =>
    applyDecorators(
      ApiOperation({ summary: 'Revoke the current session refresh token' }),
      ApiResponse({ status: 200 }),
    ),
  requestOtp: () =>
    applyDecorators(
      ApiOperation({ summary: 'Request an email verification OTP' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 429, description: 'Rate limited' }),
    ),
  verifyOtp: () =>
    applyDecorators(
      ApiOperation({ summary: 'Verify an OTP code to complete Phase B' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 400, description: 'Invalid code' }),
      ApiResponse({ status: 410, description: 'Code expired' }),
      ApiResponse({ status: 429, description: 'Too many attempts' }),
    ),
  initiatePasswordReset: () =>
    applyDecorators(
      ApiOperation({ summary: 'Initiate a password reset (sends email)' }),
      ApiResponse({ status: 200, description: 'Always returns 200' }),
    ),
  completePasswordReset: () =>
    applyDecorators(
      ApiOperation({ summary: 'Complete a password reset with a token' }),
      ApiResponse({ status: 200 }),
      ApiResponse({ status: 400, description: 'Invalid token' }),
      ApiResponse({ status: 410, description: 'Token expired' }),
    ),
};

export function ApiAuthentication(): ClassDecorator;
export function ApiAuthentication(method: AuthMethod): MethodDecorator;
export function ApiAuthentication(method?: AuthMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Authentication'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
