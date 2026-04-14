import {
  Body,
  Controller,
  Delete,
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
import { CategoriesService } from './categories.service';
import { ApiCategories } from './categories.swagger';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { GetCategoriesQueryDto } from './dtos/get-categories-query.dto';
import { GetCategoryDto } from './dtos/get-category.dto';
import { ReorderCategoriesDto } from './dtos/reorder-categories.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@ApiCategories()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiCategories('createOne')
  @RequirePermission(Permissions.CategoriesCreate)
  @AuditLog({ action: 'Create', resource: 'Category' })
  async createOne(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ): Promise<GetCategoryDto> {
    const category = await this.categoriesService.createOne(user, CreateCategoryDto.toInput(dto));
    return GetCategoryDto.toDto(category);
  }

  @Get()
  @ApiCategories('getMany')
  @RequirePermission(Permissions.CategoriesRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetCategoriesQueryDto,
  ): Promise<{
    data: GetCategoryDto[];
    meta: {
      total: number;
      take: number;
      skip: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { data, meta } = await this.categoriesService.getMany(user, {
      skip: query.skip,
      take: query.take,
      sortOrder: query.sortOrder,
    });
    return { data: data.map((category) => GetCategoryDto.toDto(category)), meta };
  }

  @Get(':id')
  @ApiCategories('getOneById')
  @RequirePermission(Permissions.CategoriesRead)
  async getOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetCategoryDto> {
    const category = await this.categoriesService.getOne(user, id);
    return GetCategoryDto.toDto(category);
  }

  @Patch(':id')
  @ApiCategories('updateOneById')
  @RequirePermission(Permissions.CategoriesUpdate)
  @AuditLog({
    action: 'Update',
    resource: 'Category',
    captureDifferences: true,
    entityIdParam: 'id',
  })
  async updateOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<GetCategoryDto> {
    const category = await this.categoriesService.updateOne(
      user,
      id,
      UpdateCategoryDto.toInput(dto),
    );
    return GetCategoryDto.toDto(category);
  }

  @Delete(':id')
  @ApiCategories('deleteOneById')
  @RequirePermission(Permissions.CategoriesDelete)
  @AuditLog({ action: 'Delete', resource: 'Category', entityIdParam: 'id' })
  async deleteOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetCategoryDto> {
    const category = await this.categoriesService.deleteOne(user, id);
    return GetCategoryDto.toDto(category);
  }

  @Put('reorder')
  @ApiCategories('reorder')
  @RequirePermission(Permissions.CategoriesReorder)
  @AuditLog({ action: 'Reorder', resource: 'Category' })
  async reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderCategoriesDto,
  ): Promise<void> {
    await this.categoriesService.reorderCategories(user, dto.categoryIds);
  }
}
