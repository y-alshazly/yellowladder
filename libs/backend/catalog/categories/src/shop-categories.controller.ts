import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import { CurrentUser, RequirePermission } from '@yellowladder/backend-infra-auth';
import { Permissions, type AuthenticatedUser } from '@yellowladder/shared-types';
import { GetShopCategoryDto } from './dtos/get-shop-category.dto';
import { UpdateShopCategoryDto } from './dtos/update-shop-category.dto';
import { ShopCategoriesService } from './shop-categories.service';
import { ApiShopCategories } from './shop-categories.swagger';

@ApiShopCategories()
@Controller('shops/:shopId/categories')
export class ShopCategoriesController {
  constructor(private readonly shopCategoriesService: ShopCategoriesService) {}

  @Get()
  @ApiShopCategories('getMany')
  @RequirePermission(Permissions.CategoriesRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
  ): Promise<GetShopCategoryDto[]> {
    const overrides = await this.shopCategoriesService.getMany(user, shopId);
    return overrides.map((override) => GetShopCategoryDto.toDto(override));
  }

  @Put(':categoryId')
  @ApiShopCategories('createOrUpdate')
  @RequirePermission(Permissions.ShopCategoriesUpdate)
  @AuditLog({ action: 'Update', resource: 'ShopCategory', entityIdParam: 'categoryId' })
  async createOrUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateShopCategoryDto,
  ): Promise<GetShopCategoryDto> {
    const override = await this.shopCategoriesService.createOrUpdate(
      user,
      shopId,
      categoryId,
      UpdateShopCategoryDto.toInput(dto),
    );
    return GetShopCategoryDto.toDto(override);
  }

  @Delete(':categoryId')
  @ApiShopCategories('deleteOne')
  @RequirePermission(Permissions.ShopCategoriesUpdate)
  @AuditLog({ action: 'Delete', resource: 'ShopCategory', entityIdParam: 'categoryId' })
  async deleteOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ): Promise<void> {
    await this.shopCategoriesService.deleteOne(user, shopId, categoryId);
  }
}
