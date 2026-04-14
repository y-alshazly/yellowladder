import { ApiProperty } from '@nestjs/swagger';
import type { ShopCategory } from '@prisma/client';
import type { GetShopCategoryResponse } from '@yellowladder/shared-types';

export class GetShopCategoryDto implements GetShopCategoryResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() shopId!: string;
  @ApiProperty() categoryId!: string;
  @ApiProperty({ nullable: true }) nameEn!: string | null;
  @ApiProperty({ nullable: true }) nameDe!: string | null;
  @ApiProperty({ nullable: true }) nameFr!: string | null;
  @ApiProperty({ nullable: true }) sortOrder!: number | null;
  @ApiProperty({ nullable: true }) isActive!: boolean | null;
  @ApiProperty() isNew!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: ShopCategory): GetShopCategoryDto {
    const dto = new GetShopCategoryDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.shopId = entity.shopId;
    dto.categoryId = entity.categoryId;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.isNew = entity.isNew;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
