import { ApiProperty } from '@nestjs/swagger';
import type { Category } from '@prisma/client';
import type { GetCategoryResponse } from '@yellowladder/shared-types';

export class GetCategoryDto implements GetCategoryResponse {
  @ApiProperty() id!: string;
  @ApiProperty() companyId!: string;
  @ApiProperty() nameEn!: string;
  @ApiProperty() nameDe!: string;
  @ApiProperty() nameFr!: string;
  @ApiProperty({ nullable: true }) iconName!: string | null;
  @ApiProperty({ nullable: true }) emojiCode!: string | null;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: Category): GetCategoryDto {
    const dto = new GetCategoryDto();
    dto.id = entity.id;
    dto.companyId = entity.companyId;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.iconName = entity.iconName;
    dto.emojiCode = entity.emojiCode;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
