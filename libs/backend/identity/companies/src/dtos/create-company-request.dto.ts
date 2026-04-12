import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreateCompanyBusinessProfile,
  CreateCompanyRequest,
  LimitedCompanyDetails,
  PrimaryContactInput,
  SelfEmployedDetails,
} from '@yellowladder/shared-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class AddressDto {
  @ApiProperty() @IsString() @MaxLength(255) line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2!: string | null;

  @ApiProperty() @IsString() @MaxLength(128) city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  region!: string | null;

  @ApiProperty() @IsString() @MaxLength(16) postalCode!: string;

  @ApiProperty() @IsString() @Length(2, 2) countryCode!: string;
}

class PrimaryContactInputDto implements PrimaryContactInput {
  @ApiProperty({ enum: ['PSC', 'MANUAL'] })
  @IsIn(['PSC', 'MANUAL'])
  source!: 'PSC' | 'MANUAL';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  pscId?: string;

  @ApiProperty() @IsString() @MaxLength(120) firstName!: string;
  @ApiProperty() @IsString() @MaxLength(120) lastName!: string;
  @ApiProperty() @IsString() @MaxLength(120) jobPosition!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneE164?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;
}

class LimitedCompanyDetailsDto implements LimitedCompanyDetails {
  @ApiProperty({ enum: ['LIMITED_COMPANY'] })
  @IsIn(['LIMITED_COMPANY'])
  businessType!: 'LIMITED_COMPANY';

  @ApiProperty()
  @IsString()
  @Length(6, 16)
  registrationNumber!: string;

  @ApiProperty() @IsString() @MaxLength(255) companyName!: string;
  @ApiProperty() @IsString() @MaxLength(255) tradingName!: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  registeredAddress!: AddressDto;

  @ApiProperty() @IsISO8601() incorporationDate!: string;

  @ApiProperty({ type: PrimaryContactInputDto })
  @ValidateNested()
  @Type(() => PrimaryContactInputDto)
  primaryContact!: PrimaryContactInputDto;
}

class SelfEmployedDetailsDto implements SelfEmployedDetails {
  @ApiProperty({ enum: ['SELF_EMPLOYED'] })
  @IsIn(['SELF_EMPLOYED'])
  businessType!: 'SELF_EMPLOYED';

  @ApiProperty() @IsString() @MaxLength(120) firstName!: string;
  @ApiProperty() @IsString() @MaxLength(120) lastName!: string;
  @ApiProperty() @IsString() @MaxLength(120) jobPosition!: string;
  @ApiProperty() @IsISO8601() dateOfBirth!: string;
  @ApiProperty() @IsString() @MaxLength(255) legalBusinessName!: string;
  @ApiProperty() @IsString() @MaxLength(255) tradingName!: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  registeredAddress!: AddressDto;

  @ApiProperty() @IsBoolean() storeIsSameAddress!: boolean;
}

class BusinessProfileDto implements CreateCompanyBusinessProfile {
  @ApiProperty() @IsUUID() businessCategoryId!: string;
  @ApiProperty() @IsUUID() paymentMethodPreferenceId!: string;
  @ApiProperty() @IsUUID() annualTurnoverBandId!: string;
  @ApiProperty() @IsBoolean() vatRegistered!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  vatNumber?: string;
}

/**
 * Named repository input type for `CompaniesService.createOne`. This is the
 * validated DTO payload — the service narrows the discriminated union via
 * `details.businessType` before handing data to the repository.
 */
export type CreateCompanyInput = CreateCompanyRequestDto;

export class CreateCompanyRequestDto implements CreateCompanyRequest {
  @ApiProperty()
  @IsUUID()
  idempotencyKey!: string;

  @ApiProperty({ type: BusinessProfileDto })
  @ValidateNested()
  @Type(() => BusinessProfileDto)
  businessProfile!: BusinessProfileDto;

  /**
   * Discriminated union — discriminator is `details.businessType`.
   *
   * We rely on `class-transformer`'s built-in discriminator support so that
   * the correct sub-DTO instance (LimitedCompanyDetailsDto /
   * SelfEmployedDetailsDto) is actually constructed and class-validator
   * runs every nested rule. Using `@Type(() => Object)` would keep the raw
   * object untouched and no nested validator would ever fire — every field
   * inside `details` would pass through unchallenged (see review B-4).
   */
  @ApiProperty({
    oneOf: [{ $ref: '#/components/schemas/LimitedCompanyDetailsDto' }, { $ref: '#/components/schemas/SelfEmployedDetailsDto' }],
  })
  @ValidateNested()
  @Type(() => Object, {
    discriminator: {
      property: 'businessType',
      subTypes: [
        { value: LimitedCompanyDetailsDto, name: 'LIMITED_COMPANY' },
        { value: SelfEmployedDetailsDto, name: 'SELF_EMPLOYED' },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  @IsNotEmpty()
  details!: LimitedCompanyDetailsDto | SelfEmployedDetailsDto;

  @ApiProperty()
  @IsISO8601()
  authorisationConfirmedAt!: string;

  /**
   * Map the validated DTO to the named repository input type. For
   * `CreateCompanyRequestDto` the shape passes through unchanged — the
   * service narrows the `details` discriminated union before any repository
   * call.
   */
  static toInput(dto: CreateCompanyRequestDto): CreateCompanyInput {
    return dto;
  }
}
