import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AuthenticationService,
  toAuthenticatedUser,
} from '@yellowladder/backend-identity-authentication';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException, type Prisma } from '@yellowladder/backend-infra-database';
import { DomainEventPublisher } from '@yellowladder/backend-infra-events';
import type {
  AdminPasswordResetRequestedEventPayload,
  AuthenticatedUser,
  TeamMemberCreatedEventPayload,
  TeamMemberDeletedEventPayload,
} from '@yellowladder/shared-types';
import {
  IdentityEventTopic,
  IdentityUsersErrors,
  OnboardingPhase,
  Permissions,
  RoleHierarchy,
  UserRole,
  UserStatus,
} from '@yellowladder/shared-types';
import type { GetTeamMembersQueryDto } from './dtos/get-team-members-query.dto';
import type { ProfileUpdateRequestDto } from './dtos/profile-update-request.dto';
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  UserWithShops,
} from './users.repository';
import { UsersRepository } from './users.repository';

// ---------------------------------------------------------------------------
// Assignable roles for team management endpoints. Role-rank comparisons use
// `RoleHierarchy` from `@yellowladder/shared-types` so backend and client
// consume the same source of truth.
// ---------------------------------------------------------------------------

const ASSIGNABLE_ROLES = new Set<string>([
  UserRole.CompanyAdmin,
  UserRole.ShopManager,
  UserRole.Employee,
]);

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly authenticationService: AuthenticationService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  // =========================================================================
  // Self-service (existing Feature 01 methods)
  // =========================================================================

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

  // =========================================================================
  // Team management (Feature 02)
  // =========================================================================

  async createTeamMember(
    user: AuthenticatedUser,
    input: CreateTeamMemberInput,
  ): Promise<UserWithShops> {
    this.authorizationService.requirePermission(user, Permissions.UsersCreate);
    this.assertUserHasCompany(user);

    // 1. Validate target role is assignable
    if (!ASSIGNABLE_ROLES.has(input.role)) {
      throw new BusinessException(
        IdentityUsersErrors.InvalidRoleAssignment,
        `Role "${input.role}" cannot be assigned to team members`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Privilege escalation check
    this.assertCallerOutranksTarget(user.role, input.role);

    // 3. Email uniqueness
    const existing = await this.repository.findOne({
      emailNormalised: input.email.toLowerCase().trim(),
    });
    if (existing) {
      throw new BusinessException(
        IdentityUsersErrors.DuplicateEmail,
        `A user with email "${input.email}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    // 4. Validate shops belong to the caller's company
    await this.assertShopsBelongToCompany(user.companyId, input.shopIds);

    // 5. Hash password
    const passwordHash = await this.authenticationService.hashPassword(input.password);

    // 6. Create
    const created = await this.repository.createTeamMember({
      email: input.email,
      emailNormalised: input.email.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneE164: input.phoneE164,
      phoneCountryCode: input.phoneCountryCode,
      countryCode: input.countryCode,
      role: input.role,
      companyId: user.companyId,
      onboardingPhase: OnboardingPhase.PhaseCCompleted,
      status: UserStatus.Active,
      shopIds: input.shopIds,
    });

    // 7. Publish domain event
    const payload: TeamMemberCreatedEventPayload = {
      userId: created.id,
      email: created.email,
      firstName: created.firstName ?? '',
      lastName: created.lastName ?? '',
      companyId: user.companyId,
      role: created.role,
      createdByUserId: user.id,
      occurredAt: new Date().toISOString(),
    };
    this.eventPublisher.publish(IdentityEventTopic.TeamMemberCreated, payload);

    return created;
  }

  async getMany(
    user: AuthenticatedUser,
    query: GetTeamMembersQueryDto,
  ): Promise<{
    data: UserWithShops[];
    meta: {
      total: number;
      take: number;
      skip: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    this.authorizationService.requirePermission(user, Permissions.UsersRead);
    this.assertUserHasCompany(user);

    const where: Prisma.UserWhereInput = {
      companyId: user.companyId,
    };

    // Exclude deleted unless explicitly requested
    if (!query.includeDeleted) {
      where.status = { not: UserStatus.Deleted };
    }

    // Role filter
    if (query.role) {
      where.role = query.role;
    }

    // Search filter (partial match on name or email)
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // SHOP_MANAGER scoping: only show users who share at least one shop
    if (user.role === UserRole.ShopManager) {
      where.userShops = { some: { shopId: { in: [...user.shopIds] } } };
    }

    // Shop filter
    if (query.shopId) {
      where.userShops = {
        ...((where.userShops as Prisma.UserShopListRelationFilter) ?? {}),
        some: { shopId: query.shopId },
      };
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      createdAt: query.sortOrder ?? 'desc',
    };

    const { items, total } = await this.repository.findManyWithShops(
      where,
      query.skip,
      query.take,
      orderBy,
    );

    return {
      data: items,
      meta: {
        total,
        take: query.take,
        skip: query.skip,
        hasNextPage: query.skip + query.take < total,
        hasPreviousPage: query.skip > 0,
      },
    };
  }

  async getOne(user: AuthenticatedUser, userId: string): Promise<UserWithShops> {
    this.authorizationService.requirePermission(user, Permissions.UsersRead);
    this.assertUserHasCompany(user);

    const where: Prisma.UserWhereInput = {
      id: userId,
      companyId: user.companyId,
    };

    // SHOP_MANAGER scoping: only see users who share at least one shop
    if (user.role === UserRole.ShopManager) {
      where.userShops = { some: { shopId: { in: [...user.shopIds] } } };
    }

    const found = await this.repository.findOneWithShops(where);
    if (!found) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return found;
  }

  async updateTeamMember(
    user: AuthenticatedUser,
    userId: string,
    input: UpdateTeamMemberInput,
  ): Promise<UserWithShops> {
    this.authorizationService.requirePermission(user, Permissions.UsersUpdate);
    this.assertUserHasCompany(user);

    // Fetch target — must be in same company and not deleted
    const target = await this.repository.findOneWithShops({
      id: userId,
      companyId: user.companyId,
      status: { not: UserStatus.Deleted },
    });
    if (!target) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // If email is being changed, check uniqueness
    const updateData: UpdateTeamMemberInput & { emailNormalised?: string } = { ...input };
    if (input.email) {
      const normalised = input.email.toLowerCase().trim();
      const duplicate = await this.repository.findOne({
        emailNormalised: normalised,
        id: { not: userId },
      });
      if (duplicate) {
        throw new BusinessException(
          IdentityUsersErrors.DuplicateEmail,
          `A user with email "${input.email}" already exists`,
          HttpStatus.CONFLICT,
        );
      }
      updateData.emailNormalised = normalised;
    }

    await this.repository.updateTeamMember(userId, updateData);

    // Return refreshed entity with shops
    const updated = await this.repository.findOneWithShops({ id: userId });
    if (!updated) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found after update',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return updated;
  }

  async deleteTeamMember(user: AuthenticatedUser, userId: string): Promise<void> {
    this.authorizationService.requirePermission(user, Permissions.UsersDelete);
    this.assertUserHasCompany(user);

    // Cannot delete self
    if (userId === user.id) {
      throw new BusinessException(
        IdentityUsersErrors.CannotDeleteSelf,
        'You cannot delete your own account',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Fetch target — must be in same company
    const target = await this.repository.findOne({
      id: userId,
      companyId: user.companyId,
    });
    if (!target) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (target.status === UserStatus.Deleted) {
      throw new BusinessException(
        IdentityUsersErrors.UserAlreadyDeleted,
        'User is already deleted',
        HttpStatus.CONFLICT,
      );
    }

    // Privilege escalation: cannot delete a user with a higher role
    this.assertCallerOutranksTarget(user.role, target.role);

    // Last COMPANY_ADMIN invariant
    if (target.role === UserRole.CompanyAdmin) {
      const remainingAdmins = await this.repository.countActiveCompanyAdmins(
        user.companyId,
        userId,
      );
      if (remainingAdmins === 0) {
        throw new BusinessException(
          IdentityUsersErrors.LastCompanyAdmin,
          'Cannot delete the last Company Admin',
          HttpStatus.CONFLICT,
        );
      }
    }

    await this.repository.softDeleteOne(userId);

    // Emit event so Authentication can revoke refresh tokens
    const payload: TeamMemberDeletedEventPayload = {
      userId: target.id,
      email: target.email,
      companyId: user.companyId,
      deletedByUserId: user.id,
      occurredAt: new Date().toISOString(),
    };
    this.eventPublisher.publish(IdentityEventTopic.TeamMemberDeleted, payload);
  }

  async updateRole(user: AuthenticatedUser, userId: string, role: string): Promise<UserWithShops> {
    this.authorizationService.requirePermission(user, Permissions.UsersManageRoles);
    this.assertUserHasCompany(user);

    // Validate the role is assignable
    if (!ASSIGNABLE_ROLES.has(role)) {
      throw new BusinessException(
        IdentityUsersErrors.InvalidRoleAssignment,
        `Role "${role}" cannot be assigned to team members`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Fetch target — must be in same company and not deleted
    const target = await this.repository.findOneWithShops({
      id: userId,
      companyId: user.companyId,
      status: { not: UserStatus.Deleted },
    });
    if (!target) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Privilege escalation check
    this.assertCallerOutranksTarget(user.role, role);

    // Last COMPANY_ADMIN invariant — check when demoting from COMPANY_ADMIN
    if (target.role === UserRole.CompanyAdmin && role !== UserRole.CompanyAdmin) {
      const remainingAdmins = await this.repository.countActiveCompanyAdmins(
        user.companyId,
        userId,
      );
      if (remainingAdmins === 0) {
        throw new BusinessException(
          IdentityUsersErrors.LastCompanyAdmin,
          'Cannot demote the last Company Admin',
          HttpStatus.CONFLICT,
        );
      }
    }

    await this.repository.updateRole(userId, role);

    const updated = await this.repository.findOneWithShops({ id: userId });
    if (!updated) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found after role update',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return updated;
  }

  async assignShops(
    user: AuthenticatedUser,
    userId: string,
    shopIds: string[],
  ): Promise<UserWithShops> {
    this.authorizationService.requirePermission(user, Permissions.UsersAssignShops);
    this.assertUserHasCompany(user);

    // Fetch target — must be in same company and not deleted
    const target = await this.repository.findOneWithShops({
      id: userId,
      companyId: user.companyId,
      status: { not: UserStatus.Deleted },
    });
    if (!target) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate shops belong to the company
    await this.assertShopsBelongToCompany(user.companyId, shopIds);

    await this.repository.replaceShopAssignments(userId, shopIds);

    const updated = await this.repository.findOneWithShops({ id: userId });
    if (!updated) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found after shop assignment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return updated;
  }

  async adminResetPassword(user: AuthenticatedUser, userId: string): Promise<void> {
    this.authorizationService.requirePermission(user, Permissions.UsersResetPassword);
    this.assertUserHasCompany(user);

    // Fetch target — must be in same company and not deleted
    const target = await this.repository.findOne({
      id: userId,
      companyId: user.companyId,
      status: { not: UserStatus.Deleted },
    });
    if (!target) {
      throw new BusinessException(
        IdentityUsersErrors.UserNotFound,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Publish event — the Integrations domain (email) handles sending
    // the actual password reset email using the same mechanism as the
    // self-service forgot-password flow.
    const payload: AdminPasswordResetRequestedEventPayload = {
      userId: target.id,
      email: target.email,
      requestedByUserId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      occurredAt: new Date().toISOString(),
    };
    this.eventPublisher.publish(IdentityEventTopic.AdminPasswordResetRequested, payload);
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  /**
   * Narrow `user.companyId` from `string | null` to `string` on team-management
   * methods. `User.companyId` is nullable in the schema (pre-onboarding users
   * have `null`), so every team-management query that filters by `companyId`
   * must reject `null` callers — otherwise `where: { companyId: null }` would
   * return every unattached user on the platform.
   *
   * Mirrors `companies.service.ts` which does the same check before touching
   * the caller's own company.
   */
  private assertUserHasCompany(
    user: AuthenticatedUser,
  ): asserts user is AuthenticatedUser & { companyId: string } {
    if (!user.companyId) {
      throw new BusinessException(
        IdentityUsersErrors.UserMustBelongToCompany,
        'User must belong to a company to manage team members',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Assert that the caller's role outranks (or equals) the target role.
   * SUPER_ADMIN > COMPANY_ADMIN > SHOP_MANAGER > EMPLOYEE > CUSTOMER.
   */
  private assertCallerOutranksTarget(callerRole: string, targetRole: string): void {
    const callerRank = this.roleRank(callerRole);
    const targetRank = this.roleRank(targetRole);
    if (callerRank < targetRank) {
      throw new BusinessException(
        IdentityUsersErrors.PrivilegeEscalation,
        'Cannot assign a role with higher privilege than your own',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private roleRank(role: string): number {
    return (RoleHierarchy as Record<string, number>)[role] ?? 0;
  }

  /**
   * Assert that all shop IDs belong to the given company. Throws if any
   * shop ID is not found in the company's shops.
   */
  private async assertShopsBelongToCompany(companyId: string, shopIds: string[]): Promise<void> {
    if (shopIds.length === 0) return;
    const companyShopIds = await this.repository.findShopIdsByCompanyId(companyId);
    const companyShopSet = new Set(companyShopIds);
    const invalid = shopIds.filter((id) => !companyShopSet.has(id));
    if (invalid.length > 0) {
      throw new BusinessException(
        IdentityUsersErrors.ShopNotInCompany,
        `Shop(s) ${invalid.join(', ')} do not belong to the company`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
