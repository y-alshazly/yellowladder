import { ApiProperty } from '@nestjs/swagger';
import type { CreateMenuAddonRequest } from '@yellowladder/shared-types';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import type { CreateMenuAddonInput } from '../menu-addons.repository';

export class CreateMenuAddonDto implements CreateMenuAddonRequest {
  @ApiProperty()
  @IsUUID()
  menuItemId!: string;

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

  static toInput(dto: CreateMenuAddonDto): Omit<CreateMenuAddonInput, 'companyId'> {
    return {
      menuItemId: dto.menuItemId,
      nameEn: dto.nameEn,
      nameDe: dto.nameDe,
      nameFr: dto.nameFr,
      ...(dto.isMultiSelect !== undefined && { isMultiSelect: dto.isMultiSelect }),
      ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
      ...(dto.maxSelections !== undefined && { maxSelections: dto.maxSelections }),
    };
  }
}
