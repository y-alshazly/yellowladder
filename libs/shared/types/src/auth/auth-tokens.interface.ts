export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  csrfToken: string;
  /**
   * Refresh token value — present only in mobile responses where there is no
   * HttpOnly cookie store. On web the refresh token is set as a cookie and
   * this field is omitted.
   */
  refreshToken?: string;
}
