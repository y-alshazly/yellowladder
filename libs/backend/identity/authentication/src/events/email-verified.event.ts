import type { EmailVerifiedEventPayload } from '@yellowladder/shared-types';
import { IdentityEventTopic } from '@yellowladder/shared-types';

export const EmailVerifiedTopic = IdentityEventTopic.EmailVerified;

export type EmailVerifiedEvent = EmailVerifiedEventPayload;
