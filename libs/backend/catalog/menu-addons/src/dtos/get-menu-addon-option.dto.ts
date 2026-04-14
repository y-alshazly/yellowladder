import { ApiProperty } from '@nestjs/swagger';
import type { MenuAddonOption } from '@prisma/client';
import type { GetMenuAddonOptionResponse } from '@yellowladder/shared-types';

export class GetMenuAddonOptionDto implements GetMenuAddonOptionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() menuAddonId!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty() nameDe!: string;
  @ApiProperty() nameFr!: string;
  @ApiProperty() priceModifier!: number;
  @ApiProperty({ nullable: true }) colorHex!: string | null;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: MenuAddonOption): GetMenuAddonOptionDto {
    const dto = new GetMenuAddonOptionDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.menuAddonId = entity.menuAddonId;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.priceModifier = Number(entity.priceModifier);
    dto.colorHex = entity.colorHex;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
