import { ApiProperty } from '@nestjs/swagger';
import type { UpdateShopRequest } from '@yellowladder/shared-types';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import type { UpdateShopInput } from '../shops.repository';
import { ShopAddressDto } from './shop-address.dto';

export class UpdateShopDto implements UpdateShopRequest {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({ type: ShopAddressDto, required: false })
  @ValidateNested()
  @Type(() => ShopAddressDto)
  @IsOptional()
  address?: ShopAddressDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  hours?: Record<string, unknown> | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string | null;

  static toInput(dto: UpdateShopDto): UpdateShopInput {
    const input: UpdateShopInput = {};

    if (dto.name !== undefined) input.name = dto.name;
    if (dto.phone !== undefined) input.phone = dto.phone;
    if (dto.logoUrl !== undefined) input.logoUrl = dto.logoUrl;
    if (dto.hours !== undefined) input.hours = dto.hours as Record<string, unknown> | undefined;

    if (dto.address) {
      input.addressLine1 = dto.address.line1;
      input.addressLine2 = dto.address.line2 ?? null;
      input.addressCity = dto.address.city;
      input.addressRegion = dto.address.region ?? null;
      input.addressPostcode = dto.address.postcode;
      input.addressCountryCode = dto.address.countryCode;
    }

    return input;
  }
}
