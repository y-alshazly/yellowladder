// @ts-nocheck
// CANONICAL EXAMPLE: DTO Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new DTO.
//
// Key conventions demonstrated:
// 1. Request DTO: implements shared/types interface, @ApiProperty() on each field
// 2. static toInput() returning the named repository input type (NOT raw Prisma type)
// 3. Response DTO: static toDto() factory mapping from Prisma entity
// 4. class-validator decorators (@IsString, @IsNotEmpty, @IsUUID, @IsInt, @IsOptional, etc.)
// 5. NO `[key: string]: unknown` index signature — the old CASL-era requirement is gone under RBAC
// 6. toDto() accepts the typed Prisma entity (or Record<string, unknown> fallback)
// 7. No default exports, no enums, no `any` type
// 8. Translated name fields (en/de/fr): nameEn/nameDe/nameFr, descriptionEn/descriptionDe/descriptionFr
// 9. Monetary amounts as Int (pence) — never Float

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MenuItem } from '@prisma/client';
import type {
  CreateMenuItemRequest,
  GetMenuItemResponse,
  UpdateMenuItemRequest,
} from '@yellowladder/shared-types';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import type { CreateMenuItemInput, UpdateMenuItemInput } from '../menu-items.repository';

// =====================================================================================
// REQUEST DTO — Create
// =====================================================================================
//
// - implements the shared/types CreateMenuItemRequest interface
// - has static toInput() that returns the named repository type
// - uses class-validator for runtime validation (global ValidationPipe handles enforcement)
// - uses @ApiProperty() for Swagger generation
// - NO index signature: RBAC does not need dynamic field-permission lookups

export class CreateMenuItemDto implements CreateMenuItemRequest {
  @ApiProperty({ description: 'English display name', example: 'Margherita Pizza' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ description: 'German display name', example: 'Margherita-Pizza' })
  @IsString()
  @IsNotEmpty()
  nameDe: string;

  @ApiProperty({ description: 'French display name', example: 'Pizza Margherita' })
  @IsString()
  @IsNotEmpty()
  nameFr: string;

  @ApiPropertyOptional({ description: 'English description' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'German description' })
  @IsOptional()
  @IsString()
  descriptionDe?: string;

  @ApiPropertyOptional({ description: 'French description' })
  @IsOptional()
  @IsString()
  descriptionFr?: string;

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
      nameDe: dto.nameDe,
      nameFr: dto.nameFr,
      descriptionEn: dto.descriptionEn,
      descriptionDe: dto.descriptionDe,
      descriptionFr: dto.descriptionFr,
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
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameDe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameFr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionDe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionFr?: string;

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
      nameDe: dto.nameDe,
      nameFr: dto.nameFr,
      descriptionEn: dto.descriptionEn,
      descriptionDe: dto.descriptionDe,
      descriptionFr: dto.descriptionFr,
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
// - has static toDto() factory that maps from the Prisma entity
// - the toDto() input type is `MenuItem` because services now return the raw entity
//   (field-level redaction is done by the service before returning, not by authorization helpers)

export class GetMenuItemDto implements GetMenuItemResponse {
  @ApiProperty() id: string;
  @ApiProperty() nameEn: string;
  @ApiProperty() nameDe: string;
  @ApiProperty() nameFr: string;
  @ApiProperty({ required: false }) descriptionEn?: string;
  @ApiProperty({ required: false }) descriptionDe?: string;
  @ApiProperty({ required: false }) descriptionFr?: string;
  @ApiProperty() categoryId: string;
  @ApiProperty({ description: 'Base price in pence (GBP)' }) basePrice: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  // Static factory: Prisma entity → response DTO
  // Controllers call this on every service return value.
  static toDto(entity: MenuItem): GetMenuItemDto {
    const dto = new GetMenuItemDto();
    dto.id = entity.id;
    dto.nameEn = entity.nameEn;
    dto.nameDe = entity.nameDe;
    dto.nameFr = entity.nameFr;
    dto.descriptionEn = entity.descriptionEn ?? undefined;
    dto.descriptionDe = entity.descriptionDe ?? undefined;
    dto.descriptionFr = entity.descriptionFr ?? undefined;
    dto.categoryId = entity.categoryId;
    dto.basePrice = entity.basePrice;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
