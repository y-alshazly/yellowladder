import { ApiProperty } from '@nestjs/swagger';
import type { CreateShopRequest } from '@yellowladder/shared-types';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import type { CreateShopInput } from '../shops.repository';
import { ShopAddressDto } from './shop-address.dto';

export class CreateShopDto implements CreateShopRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ type: ShopAddressDto })
  @ValidateNested()
  @Type(() => ShopAddressDto)
  address!: ShopAddressDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  hours?: Record<string, unknown> | null;

  static toInput(dto: CreateShopDto): Omit<CreateShopInput, 'companyId' | 'isMain' | 'sortOrder'> {
    return {
      name: dto.name,
      addressLine1: dto.address.line1,
      addressLine2: dto.address.line2 ?? null,
      addressCity: dto.address.city,
      addressRegion: dto.address.region ?? null,
      addressPostcode: dto.address.postcode,
      addressCountryCode: dto.address.countryCode,
      phone: dto.phone ?? null,
      hours: dto.hours as Record<string, unknown> | undefined,
    };
  }
}
