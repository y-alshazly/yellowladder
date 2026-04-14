import { ApiProperty } from '@nestjs/swagger';
import type { UpdateMenuAddonOptionRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import type { UpdateMenuAddonOptionInput } from '../menu-addon-options.repository';

export class UpdateMenuAddonOptionDto implements UpdateMenuAddonOptionRequest {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nameEn?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nameDe?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nameFr?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  priceModifier?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'colorHex must be a valid hex color (e.g. #FF0000)' })
  @IsOptional()
  colorHex?: string | null;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  static toInput(dto: UpdateMenuAddonOptionDto): UpdateMenuAddonOptionInput {
    const input: UpdateMenuAddonOptionInput = {};

    if (dto.nameEn !== undefined) input.nameEn = dto.nameEn;
    if (dto.nameDe !== undefined) input.nameDe = dto.nameDe;
    if (dto.nameFr !== undefined) input.nameFr = dto.nameFr;
    if (dto.priceModifier !== undefined) input.priceModifier = dto.priceModifier;
    if (dto.colorHex !== undefined) input.colorHex = dto.colorHex;
    if (dto.isActive !== undefined) input.isActive = dto.isActive;

    return input;
  }
}
