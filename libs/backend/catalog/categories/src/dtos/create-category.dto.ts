import { ApiProperty } from '@nestjs/swagger';
import type { CreateCategoryRequest } from '@yellowladder/shared-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { CreateCategoryInput } from '../categories.repository';

export class CreateCategoryDto implements CreateCategoryRequest {
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
  iconName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  emojiCode?: string | null;

  static toInput(dto: CreateCategoryDto): Omit<CreateCategoryInput, 'sortOrder'> {
    return {
      nameEn: dto.nameEn,
      nameDe: dto.nameDe,
      nameFr: dto.nameFr,
      iconName: dto.iconName ?? null,
      emojiCode: dto.emojiCode ?? null,
    };
  }
}
