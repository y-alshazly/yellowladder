import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser, RequirePermission } from '@yellowladder/backend-infra-auth';
import {
  Permissions,
  type AuthenticatedUser,
  type GetEffectiveMenuResponse,
} from '@yellowladder/shared-types';
import { EffectiveMenuService } from './effective-menu.service';
import { ApiEffectiveMenu } from './effective-menu.swagger';

@ApiEffectiveMenu()
@Controller('shops/:shopId/menu')
export class EffectiveMenuController {
  constructor(private readonly effectiveMenuService: EffectiveMenuService) {}

  @Get()
  @ApiEffectiveMenu('getEffectiveMenu')
  @RequirePermission(Permissions.MenuItemsRead)
  async getEffectiveMenu(
    @CurrentUser() user: AuthenticatedUser,
    @Param('shopId', ParseUUIDPipe) shopId: string,
  ): Promise<GetEffectiveMenuResponse> {
    return this.effectiveMenuService.getEffectiveMenu(user, shopId);
  }
}
