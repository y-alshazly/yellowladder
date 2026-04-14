import { ApiProperty } from '@nestjs/swagger';
import type { UpdateShopCategoryRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import type { UpdateShopCategoryInput } from '../shop-categories.repository';

export class UpdateShopCategoryDto implements UpdateShopCategoryRequest {
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
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean | null;

  static toInput(dto: UpdateShopCategoryDto): UpdateShopCategoryInput {
    const input: UpdateShopCategoryInput = {};

    if (dto.nameEn !== undefined) input.nameEn = dto.nameEn;
    if (dto.nameDe !== undefined) input.nameDe = dto.nameDe;
    if (dto.nameFr !== undefined) input.nameFr = dto.nameFr;
    if (dto.sortOrder !== undefined) input.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) input.isActive = dto.isActive;

    return input;
  }
}
