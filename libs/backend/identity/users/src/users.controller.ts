import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import {
  CurrentUser,
  RequireOnboardingPhase,
  RequirePermission,
} from '@yellowladder/backend-infra-auth';
import type {
  AuthenticatedUser,
  ChangePasswordResponse,
  ProfileUpdateResponse,
} from '@yellowladder/shared-types';
import { OnboardingPhase, Permissions } from '@yellowladder/shared-types';
import type { Request } from 'express';
import { ChangePasswordRequestDto } from './dtos/change-password-request.dto';
import { ProfileUpdateRequestDto } from './dtos/profile-update-request.dto';
import { UsersService } from './users.service';
import { ApiUsers } from './users.swagger';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  sessionId?: string;
}

@ApiUsers()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @RequirePermission(Permissions.UsersReadSelf)
  @RequireOnboardingPhase(
    OnboardingPhase.PhaseARegistered,
    OnboardingPhase.PhaseBVerified,
    OnboardingPhase.PhaseCCompleted,
  )
  @ApiUsers('getMe')
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return this.usersService.getMe(user);
  }

  @Patch('me')
  @RequirePermission(Permissions.UsersUpdateSelf)
  @RequireOnboardingPhase(
    OnboardingPhase.PhaseBVerified,
    OnboardingPhase.PhaseCCompleted,
  )
  @ApiUsers('updateMe')
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @AuditLog({ action: 'Update', resource: 'User', captureDifferences: true })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProfileUpdateRequestDto,
  ): Promise<ProfileUpdateResponse> {
    const updated = await this.usersService.updateMe(user, dto);
    return { user: updated };
  }

  @Post('me/change-password')
  @RequirePermission(Permissions.UsersChangePasswordSelf)
  @RequireOnboardingPhase(
    OnboardingPhase.PhaseBVerified,
    OnboardingPhase.PhaseCCompleted,
  )
  @ApiUsers('changePassword')
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'ChangePassword', resource: 'User' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChangePasswordResponse> {
    // Thread the current session id through so the service can preserve
    // this session while revoking every other refresh record for the user
    // (review [m-6]). The JWT `sid` claim is stashed on the request object
    // by `JwtStrategy`; read it here and pass it downstream.
    const currentSessionId = req.sessionId ?? null;
    await this.usersService.changePassword(
      user,
      dto.currentPassword,
      dto.newPassword,
      currentSessionId,
    );
    return { success: true };
  }

  @Post('me/photo')
  @RequirePermission(Permissions.UsersUploadPhotoSelf)
  @RequireOnboardingPhase(
    OnboardingPhase.PhaseBVerified,
    OnboardingPhase.PhaseCCompleted,
  )
  @ApiUsers('uploadPhoto')
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'UploadPhoto', resource: 'User' })
  async uploadPhoto(@CurrentUser() user: AuthenticatedUser): Promise<never> {
    // TODO(feature-storage): wire FileInterceptor + Sharp once
    // libs/backend/infra/storage exists. The service currently throws 501.
    return this.usersService.uploadPhoto(user);
  }
}
