import type { UserRegisteredEventPayload } from '@yellowladder/shared-types';
import { IdentityEventTopic } from '@yellowladder/shared-types';

export const UserRegisteredTopic = IdentityEventTopic.UserRegistered;

export type UserRegisteredEvent = UserRegisteredEventPayload;
