import { ApiProperty } from '@nestjs/swagger';
import type { UpdateMenuItemRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import type { UpdateMenuItemInput } from '../menu-items.repository';

export class UpdateMenuItemDto implements UpdateMenuItemRequest {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

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
  descriptionEn?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  descriptionDe?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  descriptionFr?: string | null;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  static toInput(dto: UpdateMenuItemDto): UpdateMenuItemInput {
    const input: UpdateMenuItemInput = {};

    if (dto.categoryId !== undefined) input.categoryId = dto.categoryId;
    if (dto.nameEn !== undefined) input.nameEn = dto.nameEn;
    if (dto.nameDe !== undefined) input.nameDe = dto.nameDe;
    if (dto.nameFr !== undefined) input.nameFr = dto.nameFr;
    if (dto.descriptionEn !== undefined) input.descriptionEn = dto.descriptionEn;
    if (dto.descriptionDe !== undefined) input.descriptionDe = dto.descriptionDe;
    if (dto.descriptionFr !== undefined) input.descriptionFr = dto.descriptionFr;
    if (dto.basePrice !== undefined) input.basePrice = dto.basePrice;
    if (dto.imageUrl !== undefined) input.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) input.isActive = dto.isActive;
    if (dto.isDraft !== undefined) input.isDraft = dto.isDraft;

    return input;
  }
}
