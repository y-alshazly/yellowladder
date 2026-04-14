import { ApiProperty } from '@nestjs/swagger';
import type { ReorderShopsRequest } from '@yellowladder/shared-types';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderShopsDto implements ReorderShopsRequest {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  shopIds!: string[];
}
