import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import { CurrentUser, RequirePermission } from '@yellowladder/backend-infra-auth';
import { Permissions, type AuthenticatedUser } from '@yellowladder/shared-types';
import { CreateShopDto } from './dtos/create-shop.dto';
import { GetShopDto } from './dtos/get-shop.dto';
import { GetShopsQueryDto } from './dtos/get-shops-query.dto';
import { ReorderShopsDto } from './dtos/reorder-shops.dto';
import { UpdateShopDto } from './dtos/update-shop.dto';
import { ShopsService } from './shops.service';
import { ApiShops } from './shops.swagger';

@ApiShops()
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @ApiShops('createOne')
  @RequirePermission(Permissions.ShopsCreate)
  @AuditLog({ action: 'Create', resource: 'Shop' })
  async createOne(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShopDto,
  ): Promise<GetShopDto> {
    const shop = await this.shopsService.createOne(user, CreateShopDto.toInput(dto));
    return GetShopDto.toDto(shop);
  }

  @Get()
  @ApiShops('getMany')
  @RequirePermission(Permissions.ShopsRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetShopsQueryDto,
  ): Promise<{
    data: GetShopDto[];
    meta: {
      total: number;
      take: number;
      skip: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { data, meta } = await this.shopsService.getMany(user, {
      skip: query.skip,
      take: query.take,
      includeArchived: query.includeArchived,
    });
    return { data: data.map((shop) => GetShopDto.toDto(shop)), meta };
  }

  @Get(':id')
  @ApiShops('getOneById')
  @RequirePermission(Permissions.ShopsRead)
  async getOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetShopDto> {
    const shop = await this.shopsService.getOne(user, id);
    return GetShopDto.toDto(shop);
  }

  @Patch(':id')
  @ApiShops('updateOneById')
  @RequirePermission(Permissions.ShopsUpdate)
  @AuditLog({ action: 'Update', resource: 'Shop', captureDifferences: true, entityIdParam: 'id' })
  async updateOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShopDto,
  ): Promise<GetShopDto> {
    const shop = await this.shopsService.updateOne(user, id, UpdateShopDto.toInput(dto));
    return GetShopDto.toDto(shop);
  }

  @Post(':id/archive')
  @ApiShops('archiveOneById')
  @RequirePermission(Permissions.ShopsArchive)
  @AuditLog({ action: 'Archive', resource: 'Shop', entityIdParam: 'id' })
  async archiveOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetShopDto> {
    const shop = await this.shopsService.archiveOne(user, id);
    return GetShopDto.toDto(shop);
  }

  @Post(':id/unarchive')
  @ApiShops('unarchiveOneById')
  @RequirePermission(Permissions.ShopsArchive)
  @AuditLog({ action: 'Unarchive', resource: 'Shop', entityIdParam: 'id' })
  async unarchiveOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetShopDto> {
    const shop = await this.shopsService.unarchiveOne(user, id);
    return GetShopDto.toDto(shop);
  }

  @Put('reorder')
  @ApiShops('reorder')
  @RequirePermission(Permissions.ShopsReorder)
  @AuditLog({ action: 'Reorder', resource: 'Shop' })
  async reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderShopsDto,
  ): Promise<void> {
    await this.shopsService.reorderShops(user, dto.shopIds);
  }
}
