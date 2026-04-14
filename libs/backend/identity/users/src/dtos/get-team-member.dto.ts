import { ApiProperty } from '@nestjs/swagger';
import type { GetTeamMemberResponse, UserRole, UserStatus } from '@yellowladder/shared-types';
import type { UserWithShops } from '../users.repository';

export class GetTeamMemberDto implements GetTeamMemberResponse {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true }) firstName!: string | null;
  @ApiProperty({ nullable: true }) lastName!: string | null;
  @ApiProperty() phoneE164!: string;
  @ApiProperty() phoneCountryCode!: string;
  @ApiProperty() countryCode!: string;
  @ApiProperty() role!: UserRole;
  @ApiProperty({ type: [String] }) shopIds!: string[];
  @ApiProperty({ type: [String] }) shopNames!: string[];
  @ApiProperty() status!: UserStatus;
  @ApiProperty({ nullable: true }) profilePhotoUrl!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  static toDto(entity: UserWithShops): GetTeamMemberDto {
    const dto = new GetTeamMemberDto();
    dto.id = entity.id;
    dto.email = entity.email;
    dto.firstName = entity.firstName;
    dto.lastName = entity.lastName;
    dto.phoneE164 = entity.phoneE164;
    dto.phoneCountryCode = entity.phoneCountryCode;
    dto.countryCode = entity.countryCode;
    dto.role = entity.role as UserRole;
    dto.shopIds = entity.userShops.map((us) => us.shopId);
    dto.shopNames = entity.userShops.map((us) => us.shop.name);
    dto.status = entity.status as UserStatus;
    dto.profilePhotoUrl = entity.profilePhotoUrl;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
