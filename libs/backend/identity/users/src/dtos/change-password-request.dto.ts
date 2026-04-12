import { ApiProperty } from '@nestjs/swagger';
import type { ChangePasswordRequest } from '@yellowladder/shared-types';
import { IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_MIN_LENGTH = 12;

export class ChangePasswordRequestDto implements ChangePasswordRequest {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(/[a-z]/)
  @Matches(/[A-Z]/)
  @Matches(/\d/)
  @Matches(/[^A-Za-z0-9]/)
  newPassword!: string;
}
