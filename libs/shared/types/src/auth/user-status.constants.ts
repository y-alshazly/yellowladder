export const UserStatus = {
  Active: 'ACTIVE',
  Suspended: 'SUSPENDED',
  Deleted: 'DELETED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
