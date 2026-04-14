import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import { CurrentUser, RequirePermission } from '@yellowladder/backend-infra-auth';
import { Permissions, type AuthenticatedUser } from '@yellowladder/shared-types';
import { GetMenuAddonsQueryDto } from './dtos/get-menu-addons-query.dto';
import { GetShopMenuAddonOptionDto } from './dtos/get-shop-menu-addon-option.dto';
import { GetShopMenuAddonDto } from './dtos/get-shop-menu-addon.dto';
import { UpdateShopMenuAddonOptionDto } from './dtos/update-shop-menu-addon-option.dto';
import { UpdateShopMenuAddonDto } from './dtos/update-shop-menu-addon.dto';
import { ShopMenuAddonsService } from './shop-menu-addons.service';
import { ApiShopMenuAddons } from './shop-menu-addons.swagger';

@ApiShopMenuAddons()
@Controller('shops/:shopId/menu-addons')
export class ShopMenuAddonsController {
  constructor(private readonly shopMenuAddonsService: ShopMenuAddonsService) {}

  @Get()
  @ApiShopMenuAddons('getMany')
  @RequirePermission(Permissions.MenuAddonsRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Query() query: GetMenuAddonsQueryDto,
  ): Promise<{
    data: GetShopMenuAddonDto[];
    meta: {
      total: number;
      take: number;
      skip: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { data, meta } = await this.shopMenuAddonsService.getMany(user, shopId, {
      skip: query.skip,
      take: query.take,
    });
    return { data: data.map((override) => GetShopMenuAddonDto.toDto(override)), meta };
  }

  @Put(':menuAddonId')
  @ApiShopMenuAddons('createOrUpdateOne')
  @RequirePermission(Permissions.ShopMenuAddonsUpdate)
  @AuditLog({ action: 'Update', resource: 'ShopMenuAddon', entityIdParam: 'menuAddonId' })
  async createOrUpdateOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Param('menuAddonId', ParseUUIDPipe) menuAddonId: string,
    @Body() dto: UpdateShopMenuAddonDto,
  ): Promise<GetShopMenuAddonDto> {
    const override = await this.shopMenuAddonsService.createOrUpdateOne(
      user,
      shopId,
      menuAddonId,
      UpdateShopMenuAddonDto.toInput(dto),
    );
    return GetShopMenuAddonDto.toDto(override);
  }

  @Delete(':menuAddonId')
  @ApiShopMenuAddons('deleteOne')
  @RequirePermission(Permissions.ShopMenuAddonsUpdate)
  @AuditLog({ action: 'Delete', resource: 'ShopMenuAddon', entityIdParam: 'menuAddonId' })
  async deleteOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Param('menuAddonId', ParseUUIDPipe) menuAddonId: string,
  ): Promise<void> {
    await this.shopMenuAddonsService.deleteOne(user, shopId, menuAddonId);
  }

  // ---------------------------------------------------------------------------
  // ShopMenuAddonOption overrides
  // ---------------------------------------------------------------------------

  @Put('options/:menuAddonOptionId')
  @ApiShopMenuAddons('createOrUpdateOption')
  @RequirePermission(Permissions.ShopMenuAddonsUpdate)
  @AuditLog({
    action: 'Update',
    resource: 'ShopMenuAddonOption',
    entityIdParam: 'menuAddonOptionId',
  })
  async createOrUpdateOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Param('menuAddonOptionId', ParseUUIDPipe) menuAddonOptionId: string,
    @Body() dto: UpdateShopMenuAddonOptionDto,
  ): Promise<GetShopMenuAddonOptionDto> {
    const override = await this.shopMenuAddonsService.createOrUpdateOption(
      user,
      shopId,
      menuAddonOptionId,
      UpdateShopMenuAddonOptionDto.toInput(dto),
    );
    return GetShopMenuAddonOptionDto.toDto(override);
  }

  @Delete('options/:menuAddonOptionId')
  @ApiShopMenuAddons('deleteOption')
  @RequirePermission(Permissions.ShopMenuAddonsUpdate)
  @AuditLog({
    action: 'Delete',
    resource: 'ShopMenuAddonOption',
    entityIdParam: 'menuAddonOptionId',
  })
  async deleteOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Param('menuAddonOptionId', ParseUUIDPipe) menuAddonOptionId: string,
  ): Promise<void> {
    await this.shopMenuAddonsService.deleteOption(user, shopId, menuAddonOptionId);
  }
}
