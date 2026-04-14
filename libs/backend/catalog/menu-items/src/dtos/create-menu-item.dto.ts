import { ApiProperty } from '@nestjs/swagger';
import type { CreateMenuItemRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import type { CreateMenuItemInput } from '../menu-items.repository';

export class CreateMenuItemDto implements CreateMenuItemRequest {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

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

  @ApiProperty()
  @IsNumber()
  basePrice!: number;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  static toInput(dto: CreateMenuItemDto): Omit<CreateMenuItemInput, 'sortOrder'> {
    return {
      categoryId: dto.categoryId,
      nameEn: dto.nameEn,
      nameDe: dto.nameDe,
      nameFr: dto.nameFr,
      descriptionEn: dto.descriptionEn ?? null,
      descriptionDe: dto.descriptionDe ?? null,
      descriptionFr: dto.descriptionFr ?? null,
      basePrice: dto.basePrice,
      imageUrl: dto.imageUrl ?? null,
      isDraft: dto.isDraft ?? true,
    };
  }
}
