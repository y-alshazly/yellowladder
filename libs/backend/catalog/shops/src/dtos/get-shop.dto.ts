import { ApiProperty } from '@nestjs/swagger';
import type { Shop } from '@prisma/client';
import type { GetShopResponse, ShopAddress } from '@yellowladder/shared-types';

export class GetShopDto implements GetShopResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) logoUrl!: string | null;
  @ApiProperty() address!: ShopAddress;
  @ApiProperty({ nullable: true }) phone!: string | null;
  @ApiProperty({ nullable: true }) hours!: Record<string, unknown> | null;
  @ApiProperty() isArchived!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isMain!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: Shop): GetShopDto {
    const dto = new GetShopDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.name = entity.name;
    dto.logoUrl = entity.logoUrl;
    dto.address = {
      line1: entity.addressLine1,
      line2: entity.addressLine2,
      city: entity.addressCity,
      region: entity.addressRegion,
      postcode: entity.addressPostcode,
      countryCode: entity.addressCountryCode,
    };
    dto.phone = entity.phone;
    dto.hours = entity.hours as Record<string, unknown> | null;
    dto.isArchived = entity.isArchived;
    dto.sortOrder = entity.sortOrder;
    dto.isMain = entity.isMain;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
