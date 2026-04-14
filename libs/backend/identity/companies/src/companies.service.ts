import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  AuthenticationService,
  AuthenticationUsersRepository,
  RefreshTokenRepository,
  toAuthenticatedUser,
} from '@yellowladder/backend-identity-authentication';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException, Prisma } from '@yellowladder/backend-infra-database';
import { DomainEventPublisher } from '@yellowladder/backend-infra-events';
import type { AuthenticatedUser, CreateCompanyResponse } from '@yellowladder/shared-types';
import {
  BusinessType,
  IdentityCompaniesErrors,
  IdentityEventTopic,
  OnboardingPhase,
  Permissions,
  UserRole,
} from '@yellowladder/shared-types';
import { CompaniesRepository } from './companies.repository';
import {
  AnnualTurnoverBandsRepository,
  BusinessCategoriesRepository,
  BusinessTypesRepository,
  PaymentMethodsRepository,
} from './config-lookups.repository';
import type { CreateCompanyRequestDto } from './dtos/create-company-request.dto';
import type { CompanyCreatedEvent } from './events/company-created.event';

export interface CreateCompanyContext {
  remoteIp: string | null;
  userAgent: string | null;
}

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly businessTypesRepository: BusinessTypesRepository,
    private readonly businessCategoriesRepository: BusinessCategoriesRepository,
    private readonly annualTurnoverBandsRepository: AnnualTurnoverBandsRepository,
    private readonly paymentMethodsRepository: PaymentMethodsRepository,
    private readonly usersRepository: AuthenticationUsersRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly authenticationService: AuthenticationService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createOne(
    user: AuthenticatedUser,
    input: CreateCompanyRequestDto,
    context: CreateCompanyContext,
  ): Promise<CreateCompanyResponse> {
    // 1. Authorization.
    this.authorizationService.requirePermission(user, Permissions.CompaniesCreate);

    // 2. Pre-conditions from architect §2.4 / §2.5.
    if (!user.emailVerified) {
      throw new BusinessException(
        IdentityCompaniesErrors.EmailNotVerified,
        'Email must be verified before creating a company',
        HttpStatus.FORBIDDEN,
      );
    }
    if (user.companyId) {
      throw new BusinessException(
        IdentityCompaniesErrors.UserAlreadyHasCompany,
        'This user is already linked to a company',
        HttpStatus.CONFLICT,
      );
    }

    // 3. Idempotency — return existing row on replay.
    const existing = await this.companiesRepository.findOneByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      this.logger.log(
        `Idempotent replay on POST /companies for key ${input.idempotencyKey}; returning existing row`,
      );
      return this.buildResponse(existing, user, context);
    }

    // 4. Validate references to config enum rows.
    const [businessCategory, paymentMethod, annualTurnoverBand] = await Promise.all([
      this.businessCategoriesRepository.findOneById(input.businessProfile.businessCategoryId),
      this.paymentMethodsRepository.findOneById(input.businessProfile.paymentMethodPreferenceId),
      this.annualTurnoverBandsRepository.findOneById(input.businessProfile.annualTurnoverBandId),
    ]);
    if (!businessCategory) {
      throw new BusinessException(
        IdentityCompaniesErrors.BusinessCategoryNotFound,
        'Business category not found',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!paymentMethod) {
      throw new BusinessException(
        IdentityCompaniesErrors.PaymentMethodNotFound,
        'Payment method not found',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!annualTurnoverBand) {
      throw new BusinessException(
        IdentityCompaniesErrors.AnnualTurnoverBandNotFound,
        'Annual turnover band not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 5. Look up the BusinessType row for the FK.
    const businessTypeCode = input.details.businessType;
    const businessTypeRow = await this.businessTypesRepository.findOneByCode(businessTypeCode);
    if (!businessTypeRow) {
      throw new BusinessException(
        IdentityCompaniesErrors.BusinessTypeNotFound,
        `Business type ${businessTypeCode} not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 6. Build the Company row + primary contact snapshot by branch.
    const companyName =
      input.details.businessType === BusinessType.LimitedCompany
        ? input.details.companyName
        : input.details.legalBusinessName;
    const tradingName = input.details.tradingName;
    const address = input.details.registeredAddress;
    const authorisationConfirmedAt = new Date(input.authorisationConfirmedAt);

    const companyInput = {
      name: companyName,
      tradingName,
      businessTypeCode,
      businessTypeId: businessTypeRow.id,
      businessCategoryId: businessCategory.id,
      paymentMethodId: paymentMethod.id,
      annualTurnoverBandId: annualTurnoverBand.id,
      vatRegistered: input.businessProfile.vatRegistered,
      vatNumber: input.businessProfile.vatNumber ?? null,
      registrationNumber:
        input.details.businessType === BusinessType.LimitedCompany
          ? input.details.registrationNumber
          : null,
      incorporationDate:
        input.details.businessType === BusinessType.LimitedCompany
          ? new Date(input.details.incorporationDate)
          : null,
      registeredAddressLine1: address.line1,
      registeredAddressLine2: address.line2,
      registeredAddressCity: address.city,
      registeredAddressRegion: address.region,
      registeredAddressPostcode: address.postalCode,
      registeredAddressCountryCode: address.countryCode,
      selfEmployedFirstName:
        input.details.businessType === BusinessType.SelfEmployed ? input.details.firstName : null,
      selfEmployedLastName:
        input.details.businessType === BusinessType.SelfEmployed ? input.details.lastName : null,
      selfEmployedJobPosition:
        input.details.businessType === BusinessType.SelfEmployed ? input.details.jobPosition : null,
      selfEmployedDateOfBirth:
        input.details.businessType === BusinessType.SelfEmployed
          ? new Date(input.details.dateOfBirth)
          : null,
      selfEmployedStoreIsSameAddress:
        input.details.businessType === BusinessType.SelfEmployed
          ? input.details.storeIsSameAddress
          : null,
      authorisationConfirmedAt,
      idempotencyKey: input.idempotencyKey,
      isActive: true,
    } satisfies Prisma.CompanyUncheckedCreateInput;

    const primaryContact =
      input.details.businessType === BusinessType.LimitedCompany
        ? {
            source: input.details.primaryContact.source,
            pscId: input.details.primaryContact.pscId ?? null,
            firstName: input.details.primaryContact.firstName,
            lastName: input.details.primaryContact.lastName,
            jobPosition: input.details.primaryContact.jobPosition,
            phoneE164: input.details.primaryContact.phoneE164 ?? null,
            email: input.details.primaryContact.email ?? null,
          }
        : {
            source: 'MANUAL' as const,
            pscId: null,
            firstName: input.details.firstName,
            lastName: input.details.lastName,
            jobPosition: input.details.jobPosition,
            phoneE164: null,
            email: null,
          };

    // 7. Atomic write.
    //
    // Reuse the client-generated idempotency key as `company.id`. The
    // repository runs inside `runAsNewTenant(companyId, ...)`, which opens
    // a tenant-scoped transaction with `app.current_company = companyId`
    // set BEFORE any insert — so the RLS `WITH CHECK` clause on
    // `companies` (`id = current_setting('app.current_company', true)`)
    // matches and the insert succeeds. The idempotency key is already a
    // UUID (validated by `CreateCompanyRequestDto.idempotencyKey`).
    const newCompanyId = input.idempotencyKey;
    let created;
    try {
      created = await this.companiesRepository.createCompanyWithContactAndLinkUser(
        newCompanyId,
        companyInput,
        primaryContact,
        user.id,
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(`P2002 unique violation on: ${JSON.stringify(error.meta)}`);
        // Idempotent collision — fetch and return the winner.
        const winner = await this.companiesRepository.findOneByIdempotencyKey(input.idempotencyKey);
        if (winner) {
          return this.buildResponse(winner, user, context);
        }
        throw new BusinessException(
          IdentityCompaniesErrors.CompanyAlreadyExists,
          'A company with this data already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }

    // 8. Revoke old sessions so the next refresh forces new claims with
    //    companyId populated. The controller mints + returns a fresh pair.
    await this.refreshTokenRepository.revokeAllForUser(user.id);

    // 9. Fire domain event.
    const occurredAt = new Date().toISOString();
    const eventPayload: CompanyCreatedEvent = {
      companyId: created.id,
      userId: user.id,
      businessType: businessTypeCode,
      occurredAt,
    };
    this.eventPublisher.publish(IdentityEventTopic.CompanyCreated, eventPayload);

    return this.buildResponse(created, user, context);
  }

  async getOne(user: AuthenticatedUser): Promise<{
    id: string;
    name: string;
    tradingName: string | null;
    businessTypeCode: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    this.authorizationService.requirePermission(user, Permissions.CompaniesRead);

    if (!user.companyId) {
      throw new BusinessException(
        IdentityCompaniesErrors.CompanyNotFound,
        'User is not linked to a company',
        HttpStatus.NOT_FOUND,
      );
    }

    const company = await this.companiesRepository.findOneById(user.companyId);
    if (!company) {
      throw new BusinessException(
        IdentityCompaniesErrors.CompanyNotFound,
        'Company not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return company;
  }

  async updateOne(user: AuthenticatedUser, input: { name?: string; tradingName?: string | null }) {
    this.authorizationService.requirePermission(user, Permissions.CompaniesUpdate);

    if (!user.companyId) {
      throw new BusinessException(
        IdentityCompaniesErrors.CompanyNotFound,
        'User is not linked to a company',
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.companiesRepository.findOneById(user.companyId);
    if (!existing) {
      throw new BusinessException(
        IdentityCompaniesErrors.CompanyNotFound,
        'Company not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.companiesRepository.updateOne(user.companyId, input);
  }

  async deactivateOne(user: AuthenticatedUser) {
    this.authorizationService.requirePermission(user, Permissions.CompaniesUpdate);

    if (!user.companyId) {
      throw new BusinessException(
        IdentityCompaniesErrors.CompanyNotFound,
        'User is not linked to a company',
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.companiesRepository.findOneById(user.companyId);
    if (!existing) {
      throw new BusinessException(
        IdentityCompaniesErrors.CompanyNotFound,
        'Company not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.companiesRepository.updateOne(user.companyId, { isActive: false });
  }

  private async buildResponse(
    company: {
      id: string;
      name: string;
      tradingName: string | null;
      businessTypeCode: string;
      createdAt: Date;
    },
    user: AuthenticatedUser,
    context: CreateCompanyContext,
  ): Promise<CreateCompanyResponse> {
    // Hydrate the user row so we have the freshly-set companyId +
    // PHASE_C_COMPLETED phase on the token.
    const row = await this.usersRepository.findOneById(user.id);
    if (!row) {
      throw new BusinessException(
        IdentityCompaniesErrors.CompanyNotFound,
        'User row disappeared during onboarding — please contact support',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const refreshed: AuthenticatedUser = {
      ...toAuthenticatedUser(row),
      role: UserRole.CompanyAdmin,
      companyId: company.id,
      onboardingPhase: OnboardingPhase.PhaseCCompleted,
    };

    const issued = await this.authenticationService.issueTokenPair(refreshed, context);

    const businessType =
      company.businessTypeCode === BusinessType.LimitedCompany
        ? BusinessType.LimitedCompany
        : BusinessType.SelfEmployed;

    return {
      company: {
        id: company.id,
        name: company.name,
        tradingName: company.tradingName,
        businessType,
        createdAt: company.createdAt.toISOString(),
      },
      user: {
        id: refreshed.id,
        companyId: company.id,
        role: 'COMPANY_ADMIN' as const,
      },
      tokens: issued.tokens,
    };
  }
}
