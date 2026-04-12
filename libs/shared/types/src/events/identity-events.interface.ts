/**
 * Payload shapes for every `Identity.*` domain event emitted by Feature 01.
 * Events are published via `DomainEventPublisher` (see
 * `@yellowladder/backend-infra-events`). Handlers live in the consuming
 * domain — never in the producer.
 */

export const IdentityEventTopic = {
  UserRegistered: 'identity.user-registered',
  OtpRequested: 'identity.otp-requested',
  EmailVerified: 'identity.email-verified',
  PasswordResetRequested: 'identity.password-reset-requested',
  CompanyCreated: 'identity.company-created',
} as const;

export type IdentityEventTopic = (typeof IdentityEventTopic)[keyof typeof IdentityEventTopic];

export interface UserRegisteredEventPayload {
  userId: string;
  email: string;
  occurredAt: string;
}

export interface OtpRequestedEventPayload {
  userId: string;
  email: string;
  purpose: 'EMAIL_VERIFICATION';
  expiresAt: string;
  occurredAt: string;
}

export interface EmailVerifiedEventPayload {
  userId: string;
  email: string;
  occurredAt: string;
}

export interface PasswordResetRequestedEventPayload {
  userId: string;
  email: string;
  expiresAt: string;
  occurredAt: string;
}

export interface CompanyCreatedEventPayload {
  companyId: string;
  userId: string;
  businessType: 'LIMITED_COMPANY' | 'SELF_EMPLOYED';
  occurredAt: string;
}
