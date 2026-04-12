import type { CompanyCreatedEventPayload } from '@yellowladder/shared-types';
import { IdentityEventTopic } from '@yellowladder/shared-types';

export const CompanyCreatedTopic = IdentityEventTopic.CompanyCreated;
export type CompanyCreatedEvent = CompanyCreatedEventPayload;
