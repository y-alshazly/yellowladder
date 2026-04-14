import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import { CurrentUser, RequirePermission } from '@yellowladder/backend-infra-auth';
import { Permissions, type AuthenticatedUser } from '@yellowladder/shared-types';
import { GetMenuItemsQueryDto } from './dtos/get-menu-items-query.dto';
import { GetShopMenuItemDto } from './dtos/get-shop-menu-item.dto';
import { UpdateShopMenuItemDto } from './dtos/update-shop-menu-item.dto';
import { ShopMenuItemsService } from './shop-menu-items.service';
import { ApiShopMenuItems } from './shop-menu-items.swagger';

@ApiShopMenuItems()
@Controller('shops/:shopId/menu-items')
export class ShopMenuItemsController {
  constructor(private readonly shopMenuItemsService: ShopMenuItemsService) {}

  @Get()
  @ApiShopMenuItems('getMany')
  @RequirePermission(Permissions.MenuItemsRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Query() query: GetMenuItemsQueryDto,
  ): Promise<{
    data: GetShopMenuItemDto[];
    meta: {
      total: number;
      take: number;
      skip: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { data, meta } = await this.shopMenuItemsService.getMany(user, shopId, {
      skip: query.skip,
      take: query.take,
    });
    return { data: data.map((override) => GetShopMenuItemDto.toDto(override)), meta };
  }

  @Put(':menuItemId')
  @ApiShopMenuItems('createOrUpdate')
  @RequirePermission(Permissions.ShopMenuItemsUpdate)
  @AuditLog({ action: 'Update', resource: 'ShopMenuItem', entityIdParam: 'menuItemId' })
  async createOrUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
    @Body() dto: UpdateShopMenuItemDto,
  ): Promise<GetShopMenuItemDto> {
    const override = await this.shopMenuItemsService.createOrUpdate(
      user,
      shopId,
      menuItemId,
      UpdateShopMenuItemDto.toInput(dto),
    );
    return GetShopMenuItemDto.toDto(override);
  }

  @Delete(':menuItemId')
  @ApiShopMenuItems('deleteOne')
  @RequirePermission(Permissions.ShopMenuItemsUpdate)
  @AuditLog({ action: 'Delete', resource: 'ShopMenuItem', entityIdParam: 'menuItemId' })
  async deleteOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
  ): Promise<void> {
    await this.shopMenuItemsService.deleteOne(user, shopId, menuItemId);
  }
}
