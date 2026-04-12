export interface PasswordResetInitiateRequest {
  email: string;
}

/**
 * Always returns 200 regardless of whether the email exists.
 * The `sentAt` is a server timestamp for UX only.
 */
export interface PasswordResetInitiateResponse {
  sentAt: string;
}

export interface PasswordResetCompleteRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetCompleteResponse {
  success: true;
}
