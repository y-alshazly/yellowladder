import { ApiProperty } from '@nestjs/swagger';
import type { ShopMenuItem } from '@prisma/client';
import type { GetShopMenuItemResponse } from '@yellowladder/shared-types';

export class GetShopMenuItemDto implements GetShopMenuItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() shopId!: string;
  @ApiProperty() menuItemId!: string;
  @ApiProperty({ nullable: true }) nameEn!: string | null;
  @ApiProperty({ nullable: true }) nameDe!: string | null;
  @ApiProperty({ nullable: true }) nameFr!: string | null;
  @ApiProperty({ nullable: true }) basePrice!: number | null;
  @ApiProperty({ nullable: true }) isActive!: boolean | null;
  @ApiProperty({ nullable: true }) sortOrder!: number | null;
  @ApiProperty() isNew!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: ShopMenuItem): GetShopMenuItemDto {
    const dto = new GetShopMenuItemDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.shopId = entity.shopId;
    dto.menuItemId = entity.menuItemId;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.basePrice = entity.basePrice !== null ? Number(entity.basePrice) : null;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.isNew = entity.isNew;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
