import { ApiProperty } from '@nestjs/swagger';
import type {
  PasswordResetCompleteRequest,
  PasswordResetInitiateRequest,
} from '@yellowladder/shared-types';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../authentication.constants';

export class PasswordResetInitiateRequestDto implements PasswordResetInitiateRequest {
  @ApiProperty()
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class PasswordResetCompleteRequestDto implements PasswordResetCompleteRequest {
  @ApiProperty()
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token!: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(/[a-z]/)
  @Matches(/[A-Z]/)
  @Matches(/\d/)
  @Matches(/[^A-Za-z0-9]/)
  newPassword!: string;
}
