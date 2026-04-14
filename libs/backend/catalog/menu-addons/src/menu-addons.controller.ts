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
import { CreateMenuAddonOptionDto } from './dtos/create-menu-addon-option.dto';
import { CreateMenuAddonDto } from './dtos/create-menu-addon.dto';
import { GetMenuAddonOptionDto } from './dtos/get-menu-addon-option.dto';
import { GetMenuAddonDto } from './dtos/get-menu-addon.dto';
import { GetMenuAddonsQueryDto } from './dtos/get-menu-addons-query.dto';
import { UpdateMenuAddonOptionDto } from './dtos/update-menu-addon-option.dto';
import { UpdateMenuAddonDto } from './dtos/update-menu-addon.dto';
import { MenuAddonsService } from './menu-addons.service';
import { ApiMenuAddons } from './menu-addons.swagger';

@ApiMenuAddons()
@Controller('menu-addons')
export class MenuAddonsController {
  constructor(private readonly menuAddonsService: MenuAddonsService) {}

  @Post()
  @ApiMenuAddons('createOne')
  @RequirePermission(Permissions.MenuAddonsCreate)
  @AuditLog({ action: 'Create', resource: 'MenuAddon' })
  async createOne(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMenuAddonDto,
  ): Promise<GetMenuAddonDto> {
    const addon = await this.menuAddonsService.createOne(user, CreateMenuAddonDto.toInput(dto));
    return GetMenuAddonDto.toDto(addon);
  }

  @Get()
  @ApiMenuAddons('getMany')
  @RequirePermission(Permissions.MenuAddonsRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetMenuAddonsQueryDto,
  ): Promise<{
    data: GetMenuAddonDto[];
    meta: {
      total: number;
      take: number;
      skip: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { data, meta } = await this.menuAddonsService.getMany(user, {
      skip: query.skip,
      take: query.take,
      menuItemId: query.menuItemId,
    });
    return { data: data.map((addon) => GetMenuAddonDto.toDto(addon)), meta };
  }

  @Get(':id')
  @ApiMenuAddons('getOneById')
  @RequirePermission(Permissions.MenuAddonsRead)
  async getOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuAddonDto> {
    const addon = await this.menuAddonsService.getOne(user, id);
    return GetMenuAddonDto.toDto(addon);
  }

  @Patch(':id')
  @ApiMenuAddons('updateOneById')
  @RequirePermission(Permissions.MenuAddonsUpdate)
  @AuditLog({
    action: 'Update',
    resource: 'MenuAddon',
    captureDifferences: true,
    entityIdParam: 'id',
  })
  async updateOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuAddonDto,
  ): Promise<GetMenuAddonDto> {
    const addon = await this.menuAddonsService.updateOne(user, id, UpdateMenuAddonDto.toInput(dto));
    return GetMenuAddonDto.toDto(addon);
  }

  @Delete(':id')
  @ApiMenuAddons('deleteOneById')
  @RequirePermission(Permissions.MenuAddonsDelete)
  @AuditLog({ action: 'Delete', resource: 'MenuAddon', entityIdParam: 'id' })
  async deleteOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.menuAddonsService.deleteOne(user, id);
  }

  // ---------------------------------------------------------------------------
  // MenuAddonOption sub-routes
  // ---------------------------------------------------------------------------

  @Post(':id/options')
  @ApiMenuAddons('createOption')
  @RequirePermission(Permissions.MenuAddonsCreate)
  @AuditLog({ action: 'Create', resource: 'MenuAddonOption' })
  async createOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) menuAddonId: string,
    @Body() dto: CreateMenuAddonOptionDto,
  ): Promise<GetMenuAddonOptionDto> {
    const option = await this.menuAddonsService.createOption(
      user,
      menuAddonId,
      CreateMenuAddonOptionDto.toInput(dto),
    );
    return GetMenuAddonOptionDto.toDto(option);
  }

  @Patch('options/:optionId')
  @ApiMenuAddons('updateOption')
  @RequirePermission(Permissions.MenuAddonsUpdate)
  @AuditLog({
    action: 'Update',
    resource: 'MenuAddonOption',
    captureDifferences: true,
    entityIdParam: 'optionId',
  })
  async updateOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('optionId', ParseUUIDPipe) optionId: string,
    @Body() dto: UpdateMenuAddonOptionDto,
  ): Promise<GetMenuAddonOptionDto> {
    const option = await this.menuAddonsService.updateOption(
      user,
      optionId,
      UpdateMenuAddonOptionDto.toInput(dto),
    );
    return GetMenuAddonOptionDto.toDto(option);
  }

  @Delete('options/:optionId')
  @ApiMenuAddons('deleteOption')
  @RequirePermission(Permissions.MenuAddonsDelete)
  @AuditLog({ action: 'Delete', resource: 'MenuAddonOption', entityIdParam: 'optionId' })
  async deleteOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('optionId', ParseUUIDPipe) optionId: string,
  ): Promise<void> {
    await this.menuAddonsService.deleteOption(user, optionId);
  }
}
