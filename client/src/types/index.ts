export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  hideBalances: boolean;
  defaultScope?: string;
  scopeBarOrder?: 'default_first' | 'all_first';
}

export interface ScopeAllocation {
  baseTypeId: BaseType | string;
  amount: number;
}

export interface BaseType {
  _id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  order: number;
  isDefault: boolean;
  isHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Source {
  _id: string;
  name: string;
  type: 'bank' | 'mobile_banking' | 'cash' | 'savings' | 'card' | 'other';
  icon: string;
  color: string;
  initialBalance: number;
  scopeAllocations?: ScopeAllocation[];
  currentBalance?: number;
  initialForScope?: number;
  totalIncome?: number;
  totalExpense?: number;
  accountNumber?: string;
  order: number;
  isActive: boolean;
  isHidden?: boolean;
  isBalanceHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategory {
  _id?: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Category {
  _id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  baseTypeId?: {
    _id: string;
    name: string;
    icon: string;
    color: string;
  } | string | null;
  monthlyBudget?: number;
  subcategories?: SubCategory[];
  order: number;
  isHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  _id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  date: string;
  baseTypeId: BaseType | string;
  sourceId: Source | string;
  toSourceId?: Source | string | null;
  categoryId?: Category | string | null;
  subcategoryId?: string | null;
  subcategoryName?: string;
  note?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StatsSummary {
  totalNetWorth: number; // Actual available money across accounts
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionCount: number;
}

export interface ScopeBreakdownItem {
  scopeId: string;
  name: string;
  icon: string;
  color: string;
  totalFunds: number;
  income: number;
  expense: number;
}

export interface SubcategoryStat {
  subcategoryId: string;
  name: string;
  amount: number;
  count: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
  percentage: number;
  subcategories?: SubcategoryStat[];
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface StatsResponse {
  summary: StatsSummary;
  scopeBreakdown: ScopeBreakdownItem[];
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
}
