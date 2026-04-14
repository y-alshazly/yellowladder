import { ApiProperty } from '@nestjs/swagger';
import type { UpdateCompanyRequest } from '@yellowladder/shared-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto implements UpdateCompanyRequest {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  tradingName?: string | null;

  static toInput(dto: UpdateCompanyDto): { name?: string; tradingName?: string | null } {
    const input: { name?: string; tradingName?: string | null } = {};
    if (dto.name !== undefined) input.name = dto.name;
    if (dto.tradingName !== undefined) input.tradingName = dto.tradingName;
    return input;
  }
}
