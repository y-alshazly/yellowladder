import { ApiPropertyOptional } from '@nestjs/swagger';
import type { CompaniesHouseSearchRequest } from '@yellowladder/shared-types';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CompaniesHouseSearchRequestDto implements CompaniesHouseSearchRequest {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  query!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  pageSize?: number;
}
