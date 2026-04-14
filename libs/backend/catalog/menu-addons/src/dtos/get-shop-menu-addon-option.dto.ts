import { ApiProperty } from '@nestjs/swagger';
import type { ShopMenuAddonOption } from '@prisma/client';
import type { GetShopMenuAddonOptionResponse } from '@yellowladder/shared-types';

export class GetShopMenuAddonOptionDto implements GetShopMenuAddonOptionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() shopId!: string;
  @ApiProperty() menuAddonOptionId!: string;
  @ApiProperty({ nullable: true }) nameEn!: string | null;
  @ApiProperty({ nullable: true }) nameDe!: string | null;
  @ApiProperty({ nullable: true }) nameFr!: string | null;
  @ApiProperty({ nullable: true }) priceModifier!: number | null;
  @ApiProperty({ nullable: true }) colorHex!: string | null;
  @ApiProperty({ nullable: true }) sortOrder!: number | null;
  @ApiProperty({ nullable: true }) isActive!: boolean | null;
  @ApiProperty() isNew!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: ShopMenuAddonOption): GetShopMenuAddonOptionDto {
    const dto = new GetShopMenuAddonOptionDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.shopId = entity.shopId;
    dto.menuAddonOptionId = entity.menuAddonOptionId;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.priceModifier = entity.priceModifier !== null ? Number(entity.priceModifier) : null;
    dto.colorHex = entity.colorHex;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.isNew = entity.isNew;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
