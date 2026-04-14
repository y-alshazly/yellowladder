import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BackendModule } from '@yellowladder/backend';
import { CategoriesModule } from '@yellowladder/backend-catalog-categories';
import { ItemPurchaseCountsModule } from '@yellowladder/backend-catalog-item-purchase-counts';
import { MenuAddonsModule } from '@yellowladder/backend-catalog-menu-addons';
import { MenuItemsModule } from '@yellowladder/backend-catalog-menu-items';
import { ShopsModule } from '@yellowladder/backend-catalog-shops';
import { AuditModule } from '@yellowladder/backend-identity-audit';
import { AuthenticationModule } from '@yellowladder/backend-identity-authentication';
import { AuthorizationModule, RolesGuard } from '@yellowladder/backend-identity-authorization';
import { CompaniesModule } from '@yellowladder/backend-identity-companies';
import { UsersModule } from '@yellowladder/backend-identity-users';
import {
  AuthInfraModule,
  AuthenticationGuard,
  OnboardingPhaseGuard,
} from '@yellowladder/backend-infra-auth';
import { CompaniesHouseInfraModule } from '@yellowladder/backend-infra-companies-house';
import { YellowladderConfigModule } from '@yellowladder/backend-infra-config';
import { DatabaseModule, TenantContextInterceptor } from '@yellowladder/backend-infra-database';
import { DomainEventsModule } from '@yellowladder/backend-infra-events';

@Module({
  imports: [
    // Infra — globally registered via @Global()
    YellowladderConfigModule,
    DatabaseModule,
    DomainEventsModule,
    AuthInfraModule,
    CompaniesHouseInfraModule,
    AuthorizationModule,
    AuditModule,

    // Rate limiting — defaults tuned for auth endpoints in controllers
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60 * 1000,
        limit: 120,
      },
    ]),

    // Domain modules
    AuthenticationModule,
    UsersModule,
    CompaniesModule,
    ShopsModule,
    CategoriesModule,
    MenuItemsModule,
    MenuAddonsModule,
    ItemPurchaseCountsModule,

    // Legacy health-check module (existing)
    BackendModule,
  ],
  providers: [
    // Global guards run in declared order.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: OnboardingPhaseGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Global interceptor — runs AFTER guards, so `request.user` is populated.
    // Populates the per-request TenantContextStore used by PrismaService.
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
