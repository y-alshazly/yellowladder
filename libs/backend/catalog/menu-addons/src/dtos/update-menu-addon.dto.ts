import { ApiProperty } from '@nestjs/swagger';
import type { UpdateMenuAddonRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import type { UpdateMenuAddonInput } from '../menu-addons.repository';

export class UpdateMenuAddonDto implements UpdateMenuAddonRequest {
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
  @IsBoolean()
  @IsOptional()
  isMultiSelect?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxSelections?: number | null;

  static toInput(dto: UpdateMenuAddonDto): UpdateMenuAddonInput {
    const input: UpdateMenuAddonInput = {};

    if (dto.nameEn !== undefined) input.nameEn = dto.nameEn;
    if (dto.nameDe !== undefined) input.nameDe = dto.nameDe;
    if (dto.nameFr !== undefined) input.nameFr = dto.nameFr;
    if (dto.isMultiSelect !== undefined) input.isMultiSelect = dto.isMultiSelect;
    if (dto.isRequired !== undefined) input.isRequired = dto.isRequired;
    if (dto.maxSelections !== undefined) input.maxSelections = dto.maxSelections;

    return input;
  }
}
