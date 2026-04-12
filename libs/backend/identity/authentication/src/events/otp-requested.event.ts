import type { OtpRequestedEventPayload } from '@yellowladder/shared-types';
import { IdentityEventTopic } from '@yellowladder/shared-types';

export const OtpRequestedTopic = IdentityEventTopic.OtpRequested;

export type OtpRequestedEvent = OtpRequestedEventPayload;
