import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AuthenticationService,
  toAuthenticatedUser,
} from '@yellowladder/backend-identity-authentication';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException } from '@yellowladder/backend-infra-database';
import type { AuthenticatedUser } from '@yellowladder/shared-types';
import { IdentityUsersErrors, Permissions } from '@yellowladder/shared-types';
import type { ProfileUpdateRequestDto } from './dtos/profile-update-request.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly authenticationService: AuthenticationService,
  ) {}

  async getMe(user: AuthenticatedUser): Promise<AuthenticatedUser> {
    this.authorizationService.requirePermission(user, Permissions.UsersReadSelf);
    const row = await this.repository.findOne({ id: user.id });
    if (!row) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return toAuthenticatedUser(row);
  }

  async updateMe(
    user: AuthenticatedUser,
    input: ProfileUpdateRequestDto,
  ): Promise<AuthenticatedUser> {
    this.authorizationService.requirePermission(user, Permissions.UsersUpdateSelf);
    const updated = await this.repository.updateProfile(user.id, {
      firstName: input.firstName,
      lastName: input.lastName,
      phoneE164: input.phoneE164,
      phoneCountryCode: input.phoneCountryCode,
    });
    return toAuthenticatedUser(updated);
  }

  async changePassword(
    user: AuthenticatedUser,
    currentPassword: string,
    newPassword: string,
    currentSessionId: string | null,
  ): Promise<void> {
    this.authorizationService.requirePermission(user, Permissions.UsersChangePasswordSelf);
    await this.authenticationService.changePassword(
      user,
      currentPassword,
      newPassword,
      currentSessionId,
    );
  }

  /**
   * Profile photo upload — STUB. The `users.profile_photo_url` column exists
   * in the schema, but Feature 01 does not yet have a file-upload infra lib
   * (`libs/backend/infra/storage` is deferred). Returning 501 here lets the
   * mobile team stub around the endpoint in the UI layer. See
   * TODO(feature-storage).
   */
  async uploadPhoto(user: AuthenticatedUser): Promise<never> {
    this.authorizationService.requirePermission(user, Permissions.UsersUploadPhotoSelf);
    throw new BusinessException(
      IdentityUsersErrors.ProfilePhotoNotSupported,
      'Profile photo upload is not yet supported — coming in Feature 02',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
