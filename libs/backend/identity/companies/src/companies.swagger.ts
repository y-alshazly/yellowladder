import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

type CompaniesMethod = 'createOne';

const methodDecorators: Record<CompaniesMethod, () => MethodDecorator> = {
  createOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Create the merchant company (Phase C submit)' }),
      ApiResponse({ status: 201, description: 'Company created; tokens rotated' }),
      ApiResponse({ status: 400, description: 'Validation or config lookup failure' }),
      ApiResponse({ status: 403, description: 'Email not verified / access denied' }),
      ApiResponse({ status: 409, description: 'User already has a company' }),
    ),
};

export function ApiCompanies(): ClassDecorator;
export function ApiCompanies(method: CompaniesMethod): MethodDecorator;
export function ApiCompanies(method?: CompaniesMethod): ClassDecorator | MethodDecorator {
  if (!method) {
    return applyDecorators(ApiTags('Companies'), ApiBearerAuth()) as ClassDecorator;
  }
  return methodDecorators[method]();
}
