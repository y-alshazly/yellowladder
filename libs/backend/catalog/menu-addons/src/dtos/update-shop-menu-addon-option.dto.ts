import { ApiProperty } from '@nestjs/swagger';
import type { UpdateShopMenuAddonOptionRequest } from '@yellowladder/shared-types';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import type { UpdateShopMenuAddonOptionInput } from '../shop-menu-addon-options.repository';

export class UpdateShopMenuAddonOptionDto implements UpdateShopMenuAddonOptionRequest {
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
  @IsNumber()
  @IsOptional()
  priceModifier?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'colorHex must be a valid hex color (e.g. #FF0000)' })
  @IsOptional()
  colorHex?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean | null;

  static toInput(dto: UpdateShopMenuAddonOptionDto): UpdateShopMenuAddonOptionInput {
    const input: UpdateShopMenuAddonOptionInput = {};

    if (dto.nameEn !== undefined) input.nameEn = dto.nameEn;
    if (dto.nameDe !== undefined) input.nameDe = dto.nameDe;
    if (dto.nameFr !== undefined) input.nameFr = dto.nameFr;
    if (dto.priceModifier !== undefined) input.priceModifier = dto.priceModifier;
    if (dto.colorHex !== undefined) input.colorHex = dto.colorHex;
    if (dto.sortOrder !== undefined) input.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) input.isActive = dto.isActive;

    return input;
  }
}
