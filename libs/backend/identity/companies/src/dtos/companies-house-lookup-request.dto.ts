import { ApiProperty } from '@nestjs/swagger';
import type { CompaniesHouseLookupRequest } from '@yellowladder/shared-types';
import { IsString, Length, Matches } from 'class-validator';

export class CompaniesHouseLookupRequestDto implements CompaniesHouseLookupRequest {
  @ApiProperty()
  @IsString()
  @Length(6, 16)
  @Matches(/^[A-Z0-9]+$/i, { message: 'registrationNumber must be alphanumeric' })
  registrationNumber!: string;
}
