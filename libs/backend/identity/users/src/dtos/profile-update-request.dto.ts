import { ApiPropertyOptional } from '@nestjs/swagger';
import type { ProfileUpdateRequest } from '@yellowladder/shared-types';
import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class ProfileUpdateRequestDto implements ProfileUpdateRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phoneE164 must be a valid E.164 number' })
  phoneE164?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 4)
  phoneCountryCode?: string;
}
