import { ApiProperty } from '@nestjs/swagger';
import type { UpdateShopMenuItemRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { UpdateShopMenuItemInput } from '../shop-menu-items.repository';

export class UpdateShopMenuItemDto implements UpdateShopMenuItemRequest {
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
  basePrice?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean | null;

  @ApiProperty({ required: false, nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number | null;

  static toInput(dto: UpdateShopMenuItemDto): UpdateShopMenuItemInput {
    const input: UpdateShopMenuItemInput = {};

    if (dto.nameEn !== undefined) input.nameEn = dto.nameEn;
    if (dto.nameDe !== undefined) input.nameDe = dto.nameDe;
    if (dto.nameFr !== undefined) input.nameFr = dto.nameFr;
    if (dto.basePrice !== undefined) input.basePrice = dto.basePrice;
    if (dto.isActive !== undefined) input.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) input.sortOrder = dto.sortOrder;

    return input;
  }
}
