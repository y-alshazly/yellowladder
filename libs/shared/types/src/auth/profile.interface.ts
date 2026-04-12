import type { AuthenticatedUser } from './authenticated-user.interface';

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneE164?: string;
  phoneCountryCode?: string;
}

export interface ProfileUpdateResponse {
  user: AuthenticatedUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: true;
}

export interface UploadProfilePhotoResponse {
  user: AuthenticatedUser;
}
