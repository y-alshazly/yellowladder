export const UserRole = {
  SuperAdmin: 'SUPER_ADMIN',
  CompanyAdmin: 'COMPANY_ADMIN',
  ShopManager: 'SHOP_MANAGER',
  Employee: 'EMPLOYEE',
  Customer: 'CUSTOMER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
