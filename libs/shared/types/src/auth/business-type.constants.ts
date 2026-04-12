export const BusinessType = {
  LimitedCompany: 'LIMITED_COMPANY',
  SelfEmployed: 'SELF_EMPLOYED',
} as const;

export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];
