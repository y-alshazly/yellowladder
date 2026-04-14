import { ApiProperty } from '@nestjs/swagger';
import type { MenuAddon, MenuAddonOption } from '@prisma/client';
import type { GetMenuAddonResponse } from '@yellowladder/shared-types';
import { GetMenuAddonOptionDto } from './get-menu-addon-option.dto';

export class GetMenuAddonDto implements GetMenuAddonResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() menuItemId!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty() nameDe!: string;
  @ApiProperty() nameFr!: string;
  @ApiProperty() isMultiSelect!: boolean;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty({ nullable: true }) maxSelections!: number | null;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiProperty({ type: [GetMenuAddonOptionDto] }) options!: GetMenuAddonOptionDto[];

  static toDto(entity: MenuAddon & { options: MenuAddonOption[] }): GetMenuAddonDto {
    const dto = new GetMenuAddonDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.menuItemId = entity.menuItemId;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.isMultiSelect = entity.isMultiSelect;
    dto.isRequired = entity.isRequired;
    dto.maxSelections = entity.maxSelections;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    dto.options = entity.options.map((option) => GetMenuAddonOptionDto.toDto(option));
    return dto;
  }
}
