import type { UserRole } from './user-role.constants';
import type { UserStatus } from './user-status.constants';

// ---------------------------------------------------------------------------
// Request interfaces
// ---------------------------------------------------------------------------

export interface CreateTeamMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  phoneCountryCode: string;
  countryCode: string;
  role: UserRole;
  shopIds: string[];
  password: string;
}

export interface UpdateTeamMemberRequest {
  firstName?: string;
  lastName?: string;
  phoneE164?: string;
  phoneCountryCode?: string;
  email?: string;
}

export interface UpdateTeamMemberRoleRequest {
  role: UserRole;
}

export interface AssignTeamMemberShopsRequest {
  shopIds: string[];
}

// ---------------------------------------------------------------------------
// Response interfaces
// ---------------------------------------------------------------------------

export interface GetTeamMemberResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneE164: string;
  phoneCountryCode: string;
  countryCode: string;
  role: UserRole;
  shopIds: string[];
  shopNames: string[];
  status: UserStatus;
  profilePhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteTeamMemberResponse {
  success: boolean;
}

export interface AdminResetPasswordResponse {
  success: boolean;
}
