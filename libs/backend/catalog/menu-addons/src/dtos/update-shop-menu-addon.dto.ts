import { ApiProperty } from '@nestjs/swagger';
import type { UpdateShopMenuAddonRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import type { UpdateShopMenuAddonInput } from '../shop-menu-addons.repository';

export class UpdateShopMenuAddonDto implements UpdateShopMenuAddonRequest {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nameEn?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nameDe?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nameFr?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  isMultiSelect?: boolean | null;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean | null;

  @ApiProperty({ required: false, nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxSelections?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number | null;

  static toInput(dto: UpdateShopMenuAddonDto): UpdateShopMenuAddonInput {
    const input: UpdateShopMenuAddonInput = {};

    if (dto.nameEn !== undefined) input.nameEn = dto.nameEn;
    if (dto.nameDe !== undefined) input.nameDe = dto.nameDe;
    if (dto.nameFr !== undefined) input.nameFr = dto.nameFr;
    if (dto.isMultiSelect !== undefined) input.isMultiSelect = dto.isMultiSelect;
    if (dto.isRequired !== undefined) input.isRequired = dto.isRequired;
    if (dto.maxSelections !== undefined) input.maxSelections = dto.maxSelections;
    if (dto.sortOrder !== undefined) input.sortOrder = dto.sortOrder;

    return input;
  }
}
