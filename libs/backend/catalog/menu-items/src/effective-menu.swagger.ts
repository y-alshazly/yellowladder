import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type EffectiveMenuMethod = 'getEffectiveMenu';

const methodDecorators: Record<EffectiveMenuMethod, () => MethodDecorator> = {
  getEffectiveMenu: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get the effective menu for a shop (company-level merged with shop overrides)',
      }),
      ApiResponse({ status: 200, description: 'Effective menu for the shop' }),
      ApiResponse({ status: 403, description: 'Insufficient permissions or shop access denied' }),
      ApiResponse({ status: 404, description: 'Shop not found' }),
    ),
};

export function ApiEffectiveMenu(): ClassDecorator;
export function ApiEffectiveMenu(method: EffectiveMenuMethod): MethodDecorator;
export function ApiEffectiveMenu(method?: EffectiveMenuMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Effective Menu'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
