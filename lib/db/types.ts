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
