export interface BusinessTypeOption {
  id: string;
  code: string;
  label: string;
  labelKey: string;
  sortOrder: number;
}

export interface BusinessCategoryOption {
  id: string;
  code: string;
  label: string;
  labelKey: string;
  iconName: string | null;
  sortOrder: number;
}

export interface PaymentMethodPreferenceOption {
  id: string;
  code: string;
  label: string;
  labelKey: string;
  description: string | null;
  sortOrder: number;
}

export interface AnnualTurnoverOption {
  id: string;
  code: string;
  label: string;
  labelKey: string;
  minAmountGbp: number;
  maxAmountGbp: number | null;
  sortOrder: number;
}
