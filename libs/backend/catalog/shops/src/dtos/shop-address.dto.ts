import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ShopAddressDto {
  @ApiProperty() @IsString() @IsNotEmpty() line1!: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() line2!: string | null;
  @ApiProperty() @IsString() @IsNotEmpty() city!: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() region!: string | null;
  @ApiProperty() @IsString() @IsNotEmpty() postcode!: string;
  @ApiProperty() @IsString() @IsNotEmpty() countryCode!: string;
}
