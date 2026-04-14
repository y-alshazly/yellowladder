import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import { CurrentUser, RequirePermission } from '@yellowladder/backend-infra-auth';
import { Permissions, type AuthenticatedUser } from '@yellowladder/shared-types';
import { CreateMenuItemDto } from './dtos/create-menu-item.dto';
import { GetMenuItemDto } from './dtos/get-menu-item.dto';
import { GetMenuItemsQueryDto } from './dtos/get-menu-items-query.dto';
import { UpdateMenuItemDto } from './dtos/update-menu-item.dto';
import { MenuItemsService } from './menu-items.service';
import { ApiMenuItems } from './menu-items.swagger';

@ApiMenuItems()
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Post()
  @ApiMenuItems('createOne')
  @RequirePermission(Permissions.MenuItemsCreate)
  @AuditLog({ action: 'Create', resource: 'MenuItem' })
  async createOne(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMenuItemDto,
  ): Promise<GetMenuItemDto> {
    const menuItem = await this.menuItemsService.createOne(user, CreateMenuItemDto.toInput(dto));
    return GetMenuItemDto.toDto(menuItem);
  }

  @Get()
  @ApiMenuItems('getMany')
  @RequirePermission(Permissions.MenuItemsRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetMenuItemsQueryDto,
  ): Promise<{
    data: GetMenuItemDto[];
    meta: {
      total: number;
      take: number;
      skip: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { data, meta } = await this.menuItemsService.getMany(user, {
      skip: query.skip,
      take: query.take,
      categoryId: query.categoryId,
    });
    return { data: data.map((item) => GetMenuItemDto.toDto(item)), meta };
  }

  @Get(':id')
  @ApiMenuItems('getOneById')
  @RequirePermission(Permissions.MenuItemsRead)
  async getOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const menuItem = await this.menuItemsService.getOne(user, id);
    return GetMenuItemDto.toDto(menuItem);
  }

  @Patch(':id')
  @ApiMenuItems('updateOneById')
  @RequirePermission(Permissions.MenuItemsUpdate)
  @AuditLog({
    action: 'Update',
    resource: 'MenuItem',
    captureDifferences: true,
    entityIdParam: 'id',
  })
  async updateOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ): Promise<GetMenuItemDto> {
    const menuItem = await this.menuItemsService.updateOne(
      user,
      id,
      UpdateMenuItemDto.toInput(dto),
    );
    return GetMenuItemDto.toDto(menuItem);
  }

  @Delete(':id')
  @ApiMenuItems('deleteOneById')
  @RequirePermission(Permissions.MenuItemsDelete)
  @AuditLog({ action: 'Delete', resource: 'MenuItem', entityIdParam: 'id' })
  async deleteOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const menuItem = await this.menuItemsService.deleteOne(user, id);
    return GetMenuItemDto.toDto(menuItem);
  }
}
