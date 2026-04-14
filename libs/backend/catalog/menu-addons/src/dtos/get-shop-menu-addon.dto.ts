import { ApiProperty } from '@nestjs/swagger';
import type { ShopMenuAddon } from '@prisma/client';
import type { GetShopMenuAddonResponse } from '@yellowladder/shared-types';

export class GetShopMenuAddonDto implements GetShopMenuAddonResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() shopId!: string;
  @ApiProperty() menuAddonId!: string;
  @ApiProperty({ nullable: true }) nameEn!: string | null;
  @ApiProperty({ nullable: true }) nameDe!: string | null;
  @ApiProperty({ nullable: true }) nameFr!: string | null;
  @ApiProperty({ nullable: true }) isMultiSelect!: boolean | null;
  @ApiProperty({ nullable: true }) isRequired!: boolean | null;
  @ApiProperty({ nullable: true }) maxSelections!: number | null;
  @ApiProperty({ nullable: true }) sortOrder!: number | null;
  @ApiProperty() isNew!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: ShopMenuAddon): GetShopMenuAddonDto {
    const dto = new GetShopMenuAddonDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.shopId = entity.shopId;
    dto.menuAddonId = entity.menuAddonId;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.isMultiSelect = entity.isMultiSelect;
    dto.isRequired = entity.isRequired;
    dto.maxSelections = entity.maxSelections;
    dto.sortOrder = entity.sortOrder;
    dto.isNew = entity.isNew;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
