// @ts-nocheck
// CANONICAL EXAMPLE: NestJS Controller Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new controller.
//
// Key conventions demonstrated:
// 1. Controller is thin — delegates all logic to service
// 2. AuthenticationGuard is global (APP_GUARD) — all routes require auth by default
// 3. @CurrentAbility() passed to service — authorization happens in service layer (CASL)
// 4. @CurrentCompany() extracts companyId from JWT (set by TenantContextMiddleware)
// 5. @AuditLog() on all write endpoints with correct action + resource
// 6. Controller calls CreateMenuItemDto.toInput(dto) before passing to service
// 7. Controller calls GetMenuItemDto.toDto(entity) on service return values
// 8. List endpoints return PaginatedResponse<T>
// 9. ParseUUIDPipe on all :id route params for input validation
// 10. Service receives `{ id }` object (not bare string) for CASL mergeConditionsIntoWhere
// 11. Swagger decorators extracted to a separate *.swagger.ts file (ApiMenuItems pattern)
// 12. #region blocks to group primary CRUD, override entity ops, and secondary entities
// 13. All routes versioned at /api/v1/ via global prefix in main.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuditLog } from '@yellowladder/backend-identity-audit';
import { AppAbility, CurrentAbility } from '@yellowladder/backend-identity-authorization';
import { CurrentCompany } from '@yellowladder/backend-infra-database';
import type { PaginatedResponse } from '@yellowladder/shared-types';
import { CreateMenuItemDto } from './dtos/create-menu-item.dto';
import { GetMenuItemDto } from './dtos/get-menu-item.dto';
import { GetMenuItemsQueryDto } from './dtos/get-menu-items-query.dto';
import { UpdateMenuItemDto } from './dtos/update-menu-item.dto';
import { MenuItemsService } from './menu-items.service';
import { ApiMenuItems } from './menu-items.swagger';

// NOTE: Swagger decorators live in a separate *.swagger.ts file.
// The ApiMenuItems() function is both a class and method decorator:
// - Class-level: @ApiMenuItems() → applies @ApiTags('Menu Items') + @ApiBearerAuth()
// - Method-level: @ApiMenuItems('createOne') → applies @ApiOperation + @ApiResponse

// Route is just 'menu-items' — the /api/v1 prefix is set globally in main.ts.
// AuthenticationGuard is global (APP_GUARD), so no @UseGuards() needed.
@ApiMenuItems()
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  //#region --- Primary CRUD (MenuItem — company-level entity) ----------------------------------

  @Post()
  @ApiMenuItems('createOne')
  @AuditLog({ action: 'Create', resource: 'MenuItem' })
  async createOne(
    @CurrentAbility() ability: AppAbility,
    @CurrentCompany() companyId: string,
    @Body() dto: CreateMenuItemDto,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.createOne(
      ability,
      companyId,
      CreateMenuItemDto.toInput(dto),
    );
    return GetMenuItemDto.toDto(result);
  }

  @Get()
  @ApiMenuItems('getMany')
  async getMany(
    @CurrentAbility() ability: AppAbility,
    @Query() query: GetMenuItemsQueryDto,
  ): Promise<PaginatedResponse<GetMenuItemDto>> {
    const { data, meta } = await this.menuItemsService.getMany(ability, query);
    return {
      data: data.map((item) => GetMenuItemDto.toDto(item)),
      meta,
    };
  }

  @Get(':id')
  @ApiMenuItems('getOneById')
  async getOneById(
    @CurrentAbility() ability: AppAbility,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.getOne(ability, { id });
    return GetMenuItemDto.toDto(result);
  }

  @Patch(':id')
  @ApiMenuItems('updateOneById')
  @AuditLog({ action: 'Update', resource: 'MenuItem', captureDifferences: true, entityIdParam: 'id' })
  async updateOneById(
    @CurrentAbility() ability: AppAbility,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.updateOne(
      ability,
      { id },
      UpdateMenuItemDto.toInput(dto),
    );
    return GetMenuItemDto.toDto(result);
  }

  @Delete(':id')
  @ApiMenuItems('deleteOneById')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog({ action: 'Delete', resource: 'MenuItem' })
  async deleteOneById(
    @CurrentAbility() ability: AppAbility,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.menuItemsService.deleteOne(ability, { id });
  }
  //#endregion

  //#region --- Status Transitions ----------------------------------------------------------------

  // Status transitions get dedicated endpoints with specific CASL actions and audit actions
  @Post(':id/activate')
  @ApiMenuItems('activateById')
  @AuditLog({ action: 'Update', resource: 'MenuItem' })
  async activateById(
    @CurrentAbility() ability: AppAbility,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.activate(ability, { id });
    return GetMenuItemDto.toDto(result);
  }

  @Post(':id/deactivate')
  @ApiMenuItems('deactivateById')
  @AuditLog({ action: 'Update', resource: 'MenuItem' })
  async deactivateById(
    @CurrentAbility() ability: AppAbility,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.deactivate(ability, { id });
    return GetMenuItemDto.toDto(result);
  }
  //#endregion

  // NOTE: Shop overrides (ShopMenuItem) live in a SEPARATE controller file in the same sub-module:
  // shop-menu-items.controller.ts handles /api/v1/shops/:shopId/menu-items/* endpoints.
  // The override controller imports its own ShopMenuItemsService and DTOs.
  // Both controllers are registered in the same MenuItemsModule.
}
