import { ApiProperty } from '@nestjs/swagger';
import type { AssignTeamMemberShopsRequest } from '@yellowladder/shared-types';
import { IsArray, IsUUID } from 'class-validator';

export class AssignTeamMemberShopsDto implements AssignTeamMemberShopsRequest {
  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  shopIds!: string[];
}
