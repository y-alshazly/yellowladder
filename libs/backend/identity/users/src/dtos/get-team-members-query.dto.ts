import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@yellowladder/shared-types';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

const FILTERABLE_ROLES = [UserRole.CompanyAdmin, UserRole.ShopManager, UserRole.Employee] as const;

export class GetTeamMembersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Partial match on name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: FILTERABLE_ROLES, description: 'Filter by role' })
  @IsOptional()
  @IsIn(FILTERABLE_ROLES)
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by shop assignment' })
  @IsOptional()
  @IsUUID('4')
  shopId?: string;

  @ApiPropertyOptional({ default: false, description: 'Include soft-deleted members' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean = false;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }

  get take(): number {
    return this.limit ?? 20;
  }
}
