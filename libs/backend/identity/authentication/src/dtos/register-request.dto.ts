import { ApiProperty } from '@nestjs/swagger';
import type { BusinessType, RegisterRequest } from '@yellowladder/shared-types';
import { BusinessType as BusinessTypeConst } from '@yellowladder/shared-types';
import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../authentication.constants';

/**
 * Phase A — Create Account request.
 *
 * Validation mirrors architect §1.3 STATE_CREATE_ACCOUNT gates. Backend
 * enforces a final check because the client (mobile) is not trusted.
 */
export class RegisterRequestDto implements RegisterRequest {
  @ApiProperty({ example: 'alice@merchant.co.uk' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: 'GB' })
  @IsString()
  @Length(2, 4)
  phoneCountryCode!: string;

  @ApiProperty({ example: '+447700000000' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phoneE164 must be a valid E.164 number' })
  phoneE164!: string;

  @ApiProperty({ example: 'GB' })
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @ApiProperty({ enum: [BusinessTypeConst.LimitedCompany, BusinessTypeConst.SelfEmployed] })
  @IsIn([BusinessTypeConst.LimitedCompany, BusinessTypeConst.SelfEmployed])
  businessType!: BusinessType;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one digit' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Password must contain at least one symbol' })
  password!: string;

  @ApiProperty({ example: '2026-04-11T10:00:00.000Z' })
  @IsISO8601()
  termsAcceptedAt!: string;
}
