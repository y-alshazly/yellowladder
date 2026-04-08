// @ts-nocheck
// CANONICAL EXAMPLE: DTO Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new DTO.
//
// Key conventions demonstrated:
// 1. Request DTO: implements shared/types interface, @ApiProperty() on each field
// 2. static toInput() returning the named repository input type (NOT raw Prisma type)
// 3. Response DTO: static toDto() factory mapping from Prisma entity (or pickPermittedFields output)
// 4. class-validator decorators (@IsString, @IsNotEmpty, @IsUUID, @IsInt, @IsOptional, etc.)
// 5. Index signature [key: string]: unknown — required for CASL ensureFieldsPermitted
// 6. toDto() accepts unknown because pickPermittedFields returns an untyped object
// 7. No default exports, no enums, no `any` type
// 8. Bilingual fields: nameEn/nameAr, descriptionEn/descriptionAr
// 9. Monetary amounts as Int (pence) — never Float

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import type { MenuItem } from '@prisma/client';
import type {
  CreateMenuItemRequest,
  GetMenuItemResponse,
  UpdateMenuItemRequest,
} from '@yellowladder/shared-types';
import type { CreateMenuItemInput, UpdateMenuItemInput } from '../menu-items.repository';

// =====================================================================================
// REQUEST DTO — Create
// =====================================================================================
//
// - implements the shared/types CreateMenuItemRequest interface
// - has [key: string]: unknown index signature for CASL ensureFieldsPermitted
// - has static toInput() that returns the named repository type
// - uses class-validator for runtime validation (global ValidationPipe handles enforcement)
// - uses @ApiProperty() for Swagger generation

export class CreateMenuItemDto implements CreateMenuItemRequest {
  [key: string]: unknown;

  @ApiProperty({ description: 'English display name', example: 'Margherita Pizza' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ description: 'Arabic display name', example: 'بيتزا مارجريتا' })
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @ApiPropertyOptional({ description: 'English description' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Arabic description' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiProperty({ description: 'Category UUID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Base price in pence (GBP). 1500 = £15.00', example: 1500 })
  @IsInt()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ description: 'Whether the item is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Static factory: DTO → named repository input type
  // Controllers call this before passing to the service layer.
  static toInput(dto: CreateMenuItemDto): CreateMenuItemInput {
    return {
      nameEn: dto.nameEn,
      nameAr: dto.nameAr,
      descriptionEn: dto.descriptionEn,
      descriptionAr: dto.descriptionAr,
      categoryId: dto.categoryId,
      basePrice: dto.basePrice,
      isActive: dto.isActive ?? true,
    };
  }
}

// =====================================================================================
// REQUEST DTO — Update
// =====================================================================================
//
// All fields optional for partial updates. Same conventions as create.

export class UpdateMenuItemDto implements UpdateMenuItemRequest {
  [key: string]: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Base price in pence (GBP)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePrice?: number;

  static toInput(dto: UpdateMenuItemDto): UpdateMenuItemInput {
    return {
      nameEn: dto.nameEn,
      nameAr: dto.nameAr,
      descriptionEn: dto.descriptionEn,
      descriptionAr: dto.descriptionAr,
      categoryId: dto.categoryId,
      basePrice: dto.basePrice,
    };
  }
}

// =====================================================================================
// RESPONSE DTO — Get
// =====================================================================================
//
// - implements the shared/types GetMenuItemResponse interface
// - has static toDto() factory that maps from Prisma entity (or pickPermittedFields output)
// - the toDto() input type is `unknown` because pickPermittedFields returns an opaque shape;
//   alternatively use `MenuItem` if your service guarantees the full entity is returned

export class GetMenuItemDto implements GetMenuItemResponse {
  @ApiProperty() id: string;
  @ApiProperty() nameEn: string;
  @ApiProperty() nameAr: string;
  @ApiProperty({ required: false }) descriptionEn?: string;
  @ApiProperty({ required: false }) descriptionAr?: string;
  @ApiProperty() categoryId: string;
  @ApiProperty({ description: 'Base price in pence (GBP)' }) basePrice: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  // Static factory: Prisma entity → response DTO
  // Controllers call this on every service return value.
  static toDto(entity: MenuItem | Record<string, unknown>): GetMenuItemDto {
    const dto = new GetMenuItemDto();
    dto.id = entity.id as string;
    dto.nameEn = entity.nameEn as string;
    dto.nameAr = entity.nameAr as string;
    dto.descriptionEn = entity.descriptionEn as string | undefined;
    dto.descriptionAr = entity.descriptionAr as string | undefined;
    dto.categoryId = entity.categoryId as string;
    dto.basePrice = entity.basePrice as number;
    dto.isActive = entity.isActive as boolean;
    dto.createdAt = entity.createdAt as Date;
    dto.updatedAt = entity.updatedAt as Date;
    return dto;
  }
}
