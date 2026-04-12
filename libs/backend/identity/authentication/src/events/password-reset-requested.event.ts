import type { PasswordResetRequestedEventPayload } from '@yellowladder/shared-types';
import { IdentityEventTopic } from '@yellowladder/shared-types';

export const PasswordResetRequestedTopic = IdentityEventTopic.PasswordResetRequested;

export type PasswordResetRequestedEvent = PasswordResetRequestedEventPayload;
