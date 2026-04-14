import { ApiProperty } from '@nestjs/swagger';
import type { ReorderCategoriesRequest } from '@yellowladder/shared-types';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderCategoriesDto implements ReorderCategoriesRequest {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  categoryIds!: string[];
}
