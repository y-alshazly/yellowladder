// @ts-nocheck
// CANONICAL EXAMPLE: NestJS Controller Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new controller.
//
// Key conventions demonstrated:
// 1. Controller is thin — delegates all logic to service
// 2. AuthenticationGuard is global (APP_GUARD) — all routes require auth by default
// 3. @CurrentUser() passed to service — RBAC authorization happens in the service layer
// 4. AuthenticatedUser type carries { userId, companyId, role, shopIds } — extracted from JWT
// 5. Optional @RequirePermission(Permissions.XxxYyy) decorator for early rejection before the handler runs
// 6. @AuditLog() on all write endpoints with correct action + resource
// 7. Controller calls CreateMenuItemDto.toInput(dto) before passing to service
// 8. Controller calls GetMenuItemDto.toDto(entity) on service return values
// 9. List endpoints return PaginatedResponse<T>
// 10. ParseUUIDPipe on all :id route params for input validation
// 11. Service receives `{ id }` object (not bare string) so scopeWhereToUserShops can append shop filter
// 12. Swagger decorators extracted to a separate *.swagger.ts file (ApiMenuItems pattern)
// 13. #region blocks to group primary CRUD and secondary operations
// 14. All routes versioned at /api/v1/ via global prefix in main.ts

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
import { CurrentUser, RequirePermission } from '@yellowladder/backend-identity-authorization';
import type { PaginatedResponse } from '@yellowladder/shared-types';
import { AuthenticatedUser, Permissions } from '@yellowladder/shared-types';
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

  // @RequirePermission is optional — it short-circuits the request before the handler runs.
  // The service still calls requirePermission() on its own. Double-gating is intentional:
  // the decorator is a fast fail for HTTP, the service check is the source of truth.
  @Post()
  @ApiMenuItems('createOne')
  @RequirePermission(Permissions.MenuItemsCreate)
  @AuditLog({ action: 'Create', resource: 'MenuItem' })
  async createOne(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMenuItemDto,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.createOne(user, CreateMenuItemDto.toInput(dto));
    return GetMenuItemDto.toDto(result);
  }

  @Get()
  @ApiMenuItems('getMany')
  @RequirePermission(Permissions.MenuItemsRead)
  async getMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetMenuItemsQueryDto,
  ): Promise<PaginatedResponse<GetMenuItemDto>> {
    const { data, meta } = await this.menuItemsService.getMany(user, query);
    return {
      data: data.map((item) => GetMenuItemDto.toDto(item)),
      meta,
    };
  }

  @Get(':id')
  @ApiMenuItems('getOneById')
  @RequirePermission(Permissions.MenuItemsRead)
  async getOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.getOne(user, { id });
    return GetMenuItemDto.toDto(result);
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
    const result = await this.menuItemsService.updateOne(
      user,
      { id },
      UpdateMenuItemDto.toInput(dto),
    );
    return GetMenuItemDto.toDto(result);
  }

  @Delete(':id')
  @ApiMenuItems('deleteOneById')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Permissions.MenuItemsDelete)
  @AuditLog({ action: 'Delete', resource: 'MenuItem' })
  async deleteOneById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.menuItemsService.deleteOne(user, { id });
  }
  //#endregion

  //#region --- Status Transitions ----------------------------------------------------------------

  // Status transitions get dedicated endpoints with specific permissions and audit actions.
  @Post(':id/activate')
  @ApiMenuItems('activateById')
  @RequirePermission(Permissions.MenuItemsUpdate)
  @AuditLog({ action: 'Update', resource: 'MenuItem' })
  async activateById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.activate(user, { id });
    return GetMenuItemDto.toDto(result);
  }

  @Post(':id/deactivate')
  @ApiMenuItems('deactivateById')
  @RequirePermission(Permissions.MenuItemsUpdate)
  @AuditLog({ action: 'Update', resource: 'MenuItem' })
  async deactivateById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetMenuItemDto> {
    const result = await this.menuItemsService.deactivate(user, { id });
    return GetMenuItemDto.toDto(result);
  }
  //#endregion

  // NOTE: Shop overrides (ShopMenuItem) live in a SEPARATE controller file in the same sub-module:
  // shop-menu-items.controller.ts handles /api/v1/shops/:shopId/menu-items/* endpoints.
  // The override controller imports its own ShopMenuItemsService and DTOs.
  // Both controllers are registered in the same MenuItemsModule.
}
