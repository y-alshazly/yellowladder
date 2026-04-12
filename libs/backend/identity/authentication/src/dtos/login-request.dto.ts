import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LoginRequest, UserDeviceInfoInput } from '@yellowladder/shared-types';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class UserDeviceInfoInputDto implements UserDeviceInfoInput {
  @ApiProperty()
  @IsString()
  @MaxLength(128)
  deviceId!: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'] })
  @IsIn(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  osVersion!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(32)
  appVersion!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  fcmToken?: string;
}

export class LoginRequestDto implements LoginRequest {
  @ApiProperty()
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiPropertyOptional({ type: UserDeviceInfoInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDeviceInfoInputDto)
  deviceInfo?: UserDeviceInfoInputDto;
}
