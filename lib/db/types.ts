/** DB types matching Supabase schema (English in code, translate in UI). */

export type TransactionType =
  | "income"
  | "expense"
  | "internal_transfer"
  | "adjustment";

export type AccountType =
  | "bank"
  | "cash"
  | "wallet"
  | "investment"
  | "checks"
  | "other";

export type PaymentMethod = "bank_cash" | "credit_card";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  is_active: boolean;
  allow_negative: boolean;
  opening_balance: number;
  opening_balance_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Month {
  id: string;
  year: number;
  month: number;
  label: string;
  is_closed: boolean;
  created_at: string;
}

export interface OpeningBalance {
  id: string;
  month_id: string;
  account_id: string;
  amount: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  month_id: string;
  date: string;
  type: TransactionType;
  description: string;
  category_id: string | null;
  subcategory_id: string | null;
  income_category_id: string | null;
  accrual_month_id: string | null;
  payment_method: PaymentMethod;
  is_business_expense: boolean;
  row_order: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionAmount {
  id: string;
  transaction_id: string;
  account_id: string;
  amount: number;
  created_at: string;
}

/** Transaction with its amounts (for month view). */
export interface TransactionWithAmounts extends Transaction {
  transaction_amounts: TransactionAmount[];
}

/** Full data for a month: opening balances + transactions with amounts. */
export interface MonthData {
  month: Month;
  opening_balances: OpeningBalance[];
  transactions: TransactionWithAmounts[];
}

// ---------------------------------------------------------------------------
// Cash Flow types
// ---------------------------------------------------------------------------

/** Row in the annual cash flow grid (one per category or account line). */
export interface CashFlowMonthColumn {
  month_id: string;
  label: string;
  amount: number;
}

/** Aggregated category row for cash flow annual view. */
export interface CashFlowCategoryRow {
  category_id: string | null;
  category_name: string;
  months: CashFlowMonthColumn[];
  total: number;
}

/** Opening/closing balance row per account in cash flow. */
export interface CashFlowBalanceRow {
  account_id: string;
  account_name: string;
  months: CashFlowMonthColumn[];
  total: number;
}

/** Full annual cash flow data. */
export interface CashFlowAnnualData {
  months: Month[];
  opening_balances: CashFlowBalanceRow[];
  opening_total: CashFlowMonthColumn[];
  income_rows: CashFlowCategoryRow[];
  income_total: CashFlowMonthColumn[];
  expense_rows: CashFlowCategoryRow[];
  expense_total: CashFlowMonthColumn[];
  result: CashFlowMonthColumn[];
  closing_balances: CashFlowBalanceRow[];
  closing_total: CashFlowMonthColumn[];
}

/** Detail row for monthly expense breakdown by subcategory. */
export interface CashFlowSubcategoryRow {
  subcategory_id: string | null;
  subcategory_name: string;
  bank_cash: number;
  credit_card: number;
  total: number;
}

/** Category group with its subcategory rows for monthly detail. */
export interface CashFlowCategoryDetail {
  category_id: string;
  category_name: string;
  subcategories: CashFlowSubcategoryRow[];
  bank_cash_total: number;
  credit_card_total: number;
  total: number;
}

/** Full monthly expense detail. */
export interface CashFlowMonthDetail {
  month: Month;
  categories: CashFlowCategoryDetail[];
  grand_bank_cash: number;
  grand_credit_card: number;
  grand_total: number;
}

/** Income statement (P&L) row. */
export interface IncomeStatementRow {
  label: string;
  months: CashFlowMonthColumn[];
  total: number;
}

/** Full income statement data. */
export interface IncomeStatementData {
  months: Month[];
  income_rows: IncomeStatementRow[];
  income_total: IncomeStatementRow;
  expense_rows: IncomeStatementRow[];
  expense_total: IncomeStatementRow;
  net_result: IncomeStatementRow;
}
