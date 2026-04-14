import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import {
  CurrentUser,
  RequireOnboardingPhase,
  RequirePermission,
} from '@yellowladder/backend-infra-auth';
import type {
  AdminResetPasswordResponse,
  AuthenticatedUser,
  ChangePasswordResponse,
  DeleteTeamMemberResponse,
  ProfileUpdateResponse,
} from '@yellowladder/shared-types';
import { OnboardingPhase, Permissions } from '@yellowladder/shared-types';
import type { Request } from 'express';
import { AssignTeamMemberShopsDto } from './dtos/assign-team-member-shops.dto';
import { ChangePasswordRequestDto } from './dtos/change-password-request.dto';
import { CreateTeamMemberDto } from './dtos/create-team-member.dto';
import { GetTeamMemberDto } from './dtos/get-team-member.dto';
import { GetTeamMembersQueryDto } from './dtos/get-team-members-query.dto';
import { ProfileUpdateRequestDto } from './dtos/profile-update-request.dto';
import { UpdateTeamMemberRoleDto } from './dtos/update-team-member-role.dto';
import { UpdateTeamMemberDto } from './dtos/update-team-member.dto';
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

  // =========================================================================
  // Self-service /me endpoints — MUST stay above /:id to avoid route clash
  // =========================================================================

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
  @RequireOnboardingPhase(OnboardingPhase.PhaseBVerified, OnboardingPhase.PhaseCCompleted)
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
  @RequireOnboardingPhase(OnboardingPhase.PhaseBVerified, OnboardingPhase.PhaseCCompleted)
  @ApiUsers('changePassword')
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'ChangePassword', resource: 'User' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChangePasswordResponse> {
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
  @RequireOnboardingPhase(OnboardingPhase.PhaseBVerified, OnboardingPhase.PhaseCCompleted)
  @ApiUsers('uploadPhoto')
  @Throttle({ default: { limit: 10, ttl: 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'UploadPhoto', resource: 'User' })
  async uploadPhoto(@CurrentUser() user: AuthenticatedUser): Promise<never> {
    return this.usersService.uploadPhoto(user);
  }

  // =========================================================================
  // Team management endpoints (Feature 02)
  // =========================================================================

  @Post()
  @ApiUsers('createOne')
  @RequirePermission(Permissions.UsersCreate)
  @RequireOnboardingPhase(OnboardingPhase.PhaseCCompleted)
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @AuditLog({ action: 'Create', resource: 'TeamMember' })
  async createOne(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTeamMemberDto,
  ): Promise<GetTeamMemberDto> {
    const created = await this.usersService.createTeamMember(
      user,
      CreateTeamMemberDto.toInput(dto),
    );
    return GetTeamMemberDto.toDto(created);
  }

  @Get()
  @ApiUsers('getMany')
  @RequirePermission(Permissions.UsersRead)
  @RequireOnboardingPhase(OnboardingPhase.PhaseCCompleted)
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetTeamMembersQueryDto,
  ): Promise<{
    data: GetTeamMemberDto[];
    meta: {
      total: number;
      take: number;
      skip: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { data, meta } = await this.usersService.getMany(user, query);
    return { data: data.map((item) => GetTeamMemberDto.toDto(item)), meta };
  }

  @Get(':id')
  @ApiUsers('getOneById')
  @RequirePermission(Permissions.UsersRead)
  @RequireOnboardingPhase(OnboardingPhase.PhaseCCompleted)
  @Throttle({ default: { limit: 60, ttl: 60 * 1000 } })
  async getOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetTeamMemberDto> {
    const found = await this.usersService.getOne(user, id);
    return GetTeamMemberDto.toDto(found);
  }

  @Patch(':id')
  @ApiUsers('updateOneById')
  @RequirePermission(Permissions.UsersUpdate)
  @RequireOnboardingPhase(OnboardingPhase.PhaseCCompleted)
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @AuditLog({
    action: 'Update',
    resource: 'TeamMember',
    captureDifferences: true,
    entityIdParam: 'id',
  })
  async updateOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamMemberDto,
  ): Promise<GetTeamMemberDto> {
    const updated = await this.usersService.updateTeamMember(
      user,
      id,
      UpdateTeamMemberDto.toInput(dto),
    );
    return GetTeamMemberDto.toDto(updated);
  }

  @Delete(':id')
  @ApiUsers('deleteOneById')
  @RequirePermission(Permissions.UsersDelete)
  @RequireOnboardingPhase(OnboardingPhase.PhaseCCompleted)
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'Delete', resource: 'TeamMember', entityIdParam: 'id' })
  async deleteOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteTeamMemberResponse> {
    await this.usersService.deleteTeamMember(user, id);
    return { success: true };
  }

  @Patch(':id/role')
  @ApiUsers('updateRole')
  @RequirePermission(Permissions.UsersManageRoles)
  @RequireOnboardingPhase(OnboardingPhase.PhaseCCompleted)
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @AuditLog({ action: 'UpdateRole', resource: 'TeamMember', entityIdParam: 'id' })
  async updateRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamMemberRoleDto,
  ): Promise<GetTeamMemberDto> {
    const updated = await this.usersService.updateRole(user, id, dto.role);
    return GetTeamMemberDto.toDto(updated);
  }

  @Put(':id/shops')
  @ApiUsers('assignShops')
  @RequirePermission(Permissions.UsersAssignShops)
  @RequireOnboardingPhase(OnboardingPhase.PhaseCCompleted)
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @AuditLog({ action: 'AssignShops', resource: 'TeamMember', entityIdParam: 'id' })
  async assignShops(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTeamMemberShopsDto,
  ): Promise<GetTeamMemberDto> {
    const updated = await this.usersService.assignShops(user, id, dto.shopIds);
    return GetTeamMemberDto.toDto(updated);
  }

  @Post(':id/reset-password')
  @ApiUsers('adminResetPassword')
  @RequirePermission(Permissions.UsersResetPassword)
  @RequireOnboardingPhase(OnboardingPhase.PhaseCCompleted)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'ResetPassword', resource: 'TeamMember', entityIdParam: 'id' })
  async adminResetPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminResetPasswordResponse> {
    await this.usersService.adminResetPassword(user, id);
    return { success: true };
  }
}
