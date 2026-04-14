import { ApiProperty } from '@nestjs/swagger';
import type { UpdateCategoryRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { UpdateCategoryInput } from '../categories.repository';

export class UpdateCategoryDto implements UpdateCategoryRequest {
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

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  iconName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  emojiCode?: string | null;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  static toInput(dto: UpdateCategoryDto): UpdateCategoryInput {
    const input: UpdateCategoryInput = {};

    if (dto.nameEn !== undefined) input.nameEn = dto.nameEn;
    if (dto.nameDe !== undefined) input.nameDe = dto.nameDe;
    if (dto.nameFr !== undefined) input.nameFr = dto.nameFr;
    if (dto.iconName !== undefined) input.iconName = dto.iconName;
    if (dto.emojiCode !== undefined) input.emojiCode = dto.emojiCode;
    if (dto.isActive !== undefined) input.isActive = dto.isActive;

    return input;
  }
}
