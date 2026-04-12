import { ApiProperty } from '@nestjs/swagger';
import type { OtpRequestRequest, OtpVerifyRequest } from '@yellowladder/shared-types';
import { IsEmail, Length, Matches, MaxLength } from 'class-validator';
import { OTP_CODE_LENGTH } from '../authentication.constants';

export class OtpRequestRequestDto implements OtpRequestRequest {
  @ApiProperty()
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class OtpVerifyRequestDto implements OtpVerifyRequest {
  @ApiProperty()
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ minLength: OTP_CODE_LENGTH, maxLength: OTP_CODE_LENGTH })
  @Length(OTP_CODE_LENGTH, OTP_CODE_LENGTH)
  @Matches(/^\d+$/, { message: 'OTP code must be numeric' })
  code!: string;
}
