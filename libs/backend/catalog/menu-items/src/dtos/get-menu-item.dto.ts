import { ApiProperty } from '@nestjs/swagger';
import type { MenuItem } from '@prisma/client';
import type { GetMenuItemResponse } from '@yellowladder/shared-types';

export class GetMenuItemDto implements GetMenuItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() categoryId!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty() nameDe!: string;
  @ApiProperty() nameFr!: string;
  @ApiProperty({ nullable: true }) descriptionEn!: string | null;
  @ApiProperty({ nullable: true }) descriptionDe!: string | null;
  @ApiProperty({ nullable: true }) descriptionFr!: string | null;
  @ApiProperty() basePrice!: number;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isDraft!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: MenuItem): GetMenuItemDto {
    const dto = new GetMenuItemDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.categoryId = entity.categoryId;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.descriptionEn = entity.descriptionEn;
    dto.descriptionDe = entity.descriptionDe;
    dto.descriptionFr = entity.descriptionFr;
    dto.basePrice = Number(entity.basePrice);
    dto.imageUrl = entity.imageUrl;
    dto.isActive = entity.isActive;
    dto.isDraft = entity.isDraft;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
