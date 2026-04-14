import { ApiProperty } from '@nestjs/swagger';
import type { UpdateTeamMemberRoleRequest } from '@yellowladder/shared-types';
import { UserRole } from '@yellowladder/shared-types';
import { IsIn } from 'class-validator';

const ASSIGNABLE_ROLES = [UserRole.CompanyAdmin, UserRole.ShopManager, UserRole.Employee] as const;

export class UpdateTeamMemberRoleDto implements UpdateTeamMemberRoleRequest {
  @ApiProperty({ enum: ASSIGNABLE_ROLES, example: UserRole.ShopManager })
  @IsIn(ASSIGNABLE_ROLES)
  role!: UserRole;
}
