import { ApiPropertyOptional } from '@nestjs/swagger';
import type { UpdateTeamMemberRequest } from '@yellowladder/shared-types';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import type { UpdateTeamMemberInput } from '../users.repository';

export class UpdateTeamMemberDto implements UpdateTeamMemberRequest {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional({ example: '+447700900001' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phoneE164 must be a valid E.164 number' })
  phoneE164?: string;

  @ApiPropertyOptional({ example: 'GB' })
  @IsOptional()
  @IsString()
  @Length(2, 4)
  phoneCountryCode?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  static toInput(dto: UpdateTeamMemberDto): UpdateTeamMemberInput {
    const input: UpdateTeamMemberInput = {};
    if (dto.firstName !== undefined) input.firstName = dto.firstName;
    if (dto.lastName !== undefined) input.lastName = dto.lastName;
    if (dto.phoneE164 !== undefined) input.phoneE164 = dto.phoneE164;
    if (dto.phoneCountryCode !== undefined) input.phoneCountryCode = dto.phoneCountryCode;
    if (dto.email !== undefined) input.email = dto.email;
    return input;
  }
}
