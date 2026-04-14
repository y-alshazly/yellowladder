import { ApiProperty } from '@nestjs/swagger';
import type { CreateMenuAddonOptionRequest } from '@yellowladder/shared-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import type { CreateMenuAddonOptionInput } from '../menu-addon-options.repository';

export class CreateMenuAddonOptionDto implements CreateMenuAddonOptionRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameEn!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameDe!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameFr!: string;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  priceModifier?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'colorHex must be a valid hex color (e.g. #FF0000)' })
  @IsOptional()
  colorHex?: string | null;

  static toInput(
    dto: CreateMenuAddonOptionDto,
  ): Omit<CreateMenuAddonOptionInput, 'companyId' | 'menuAddonId'> {
    return {
      nameEn: dto.nameEn,
      nameDe: dto.nameDe,
      nameFr: dto.nameFr,
      ...(dto.priceModifier !== undefined && { priceModifier: dto.priceModifier }),
      ...(dto.colorHex !== undefined && { colorHex: dto.colorHex }),
    };
  }
}
