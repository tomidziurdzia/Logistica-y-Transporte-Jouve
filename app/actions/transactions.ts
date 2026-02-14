"use server";

import { createClient } from "@/lib/supabase/server";
import type { TransactionType } from "@/lib/db/types";

export type CreateTransactionInput = {
  month_id: string;
  date: string;
  type: TransactionType;
  description: string;
  category_id?: string | null;
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
  row_order?: number;
  amounts?: { account_id: string; amount: number }[];
};

export async function updateTransaction(input: UpdateTransactionInput): Promise<void> {
  const supabase = await createClient();

  const { date, type, description, category_id, row_order, amounts } = input;
  const payload: Record<string, unknown> = {};
  if (date !== undefined) payload.date = date;
  if (type !== undefined) payload.type = type;
  if (description !== undefined) payload.description = description;
  if (category_id !== undefined) payload.category_id = category_id;
  if (row_order !== undefined) payload.row_order = row_order;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
  }

  if (amounts !== undefined) {
    await supabase.from("transaction_amounts").delete().eq("transaction_id", input.id);
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
