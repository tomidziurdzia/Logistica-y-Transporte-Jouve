"use server";

import { createClient } from "@/lib/supabase/server";
import type { TransactionType, PaymentMethod } from "@/lib/db/types";

export type CreateTransactionInput = {
  month_id: string;
  date: string;
  type: TransactionType;
  description: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  income_category_id?: string | null;
  accrual_month_id?: string | null;
  payment_method?: PaymentMethod;
  is_business_expense?: boolean;
  row_order?: number;
  amounts: { account_id: string; amount: number }[];
};

export async function createTransaction(input: CreateTransactionInput): Promise<string> {
  const supabase = await createClient();

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      month_id: input.month_id,
      date: input.date,
      type: input.type,
      description: input.description ?? "",
      category_id: input.category_id ?? null,
      subcategory_id: input.subcategory_id ?? null,
      income_category_id: input.income_category_id ?? null,
      accrual_month_id: input.accrual_month_id ?? null,
      payment_method: input.payment_method ?? "bank_cash",
      is_business_expense: input.is_business_expense ?? true,
      row_order: input.row_order ?? 0,
    })
    .select("id")
    .single();

  if (txError) throw new Error(txError.message);
  if (!tx?.id) throw new Error("Transaction not created");

  if (input.amounts.length > 0) {
    const rows = input.amounts.map(({ account_id, amount }) => ({
      transaction_id: tx.id,
      account_id,
      amount,
    }));
    const { error: amtError } = await supabase.from("transaction_amounts").insert(rows);
    if (amtError) throw new Error(amtError.message);
  }

  return tx.id;
}

export type UpdateTransactionInput = {
  id: string;
  date?: string;
  type?: TransactionType;
  description?: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  income_category_id?: string | null;
  accrual_month_id?: string | null;
  payment_method?: PaymentMethod;
  is_business_expense?: boolean;
  row_order?: number;
  amounts?: { account_id: string; amount: number }[];
};

export async function updateTransaction(input: UpdateTransactionInput): Promise<void> {
  const supabase = await createClient();

  const {
    date, type, description, category_id, subcategory_id,
    income_category_id, accrual_month_id, payment_method,
    is_business_expense, row_order, amounts,
  } = input;

  const payload: Record<string, unknown> = {};
  if (date !== undefined) payload.date = date;
  if (type !== undefined) payload.type = type;
  if (description !== undefined) payload.description = description;
  if (category_id !== undefined) payload.category_id = category_id;
  if (subcategory_id !== undefined) payload.subcategory_id = subcategory_id;
  if (income_category_id !== undefined) payload.income_category_id = income_category_id;
  if (accrual_month_id !== undefined) payload.accrual_month_id = accrual_month_id;
  if (payment_method !== undefined) payload.payment_method = payment_method;
  if (is_business_expense !== undefined) payload.is_business_expense = is_business_expense;
  if (row_order !== undefined) payload.row_order = row_order;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
  }

  if (amounts !== undefined) {
    const { error: deleteError } = await supabase
      .from("transaction_amounts")
      .delete()
      .eq("transaction_id", input.id);
    if (deleteError) throw new Error(deleteError.message);
    if (amounts.length > 0) {
      const rows = amounts.map(({ account_id, amount }) => ({
        transaction_id: input.id,
        account_id,
        amount,
      }));
      const { error } = await supabase.from("transaction_amounts").insert(rows);
      if (error) throw new Error(error.message);
    }
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) throw new Error(error.message);
}
