import { ApiProperty } from '@nestjs/swagger';
import type { CreateTeamMemberRequest } from '@yellowladder/shared-types';
import { UserRole } from '@yellowladder/shared-types';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { CreateTeamMemberInput } from '../users.repository';

const ASSIGNABLE_ROLES = [UserRole.CompanyAdmin, UserRole.ShopManager, UserRole.Employee] as const;

export class CreateTeamMemberDto implements CreateTeamMemberRequest {
  @ApiProperty({ example: 'team@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName!: string;

  @ApiProperty({ example: '+447700900000' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phoneE164 must be a valid E.164 number' })
  phoneE164!: string;

  @ApiProperty({ example: 'GB' })
  @IsString()
  @Length(2, 4)
  phoneCountryCode!: string;

  @ApiProperty({ example: 'GB' })
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @ApiProperty({ enum: ASSIGNABLE_ROLES, example: UserRole.Employee })
  @IsIn(ASSIGNABLE_ROLES)
  role!: UserRole;

  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  shopIds!: string[];

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  static toInput(dto: CreateTeamMemberDto): CreateTeamMemberInput {
    return {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneE164: dto.phoneE164,
      phoneCountryCode: dto.phoneCountryCode,
      countryCode: dto.countryCode,
      role: dto.role,
      shopIds: dto.shopIds,
      password: dto.password,
    };
  }
}
