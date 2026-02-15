"use server";

import { createClient } from "@/lib/supabase/server";
import type { Month, MonthData, OpeningBalance, TransactionWithAmounts } from "@/lib/db/types";

export async function getMonths(): Promise<Month[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Month[];
}

export async function getMonthData(monthId: string): Promise<MonthData | null> {
  const supabase = await createClient();

  const [monthRes, obRes, txRes] = await Promise.all([
    supabase.from("months").select("*").eq("id", monthId).single(),
    supabase.from("opening_balances").select("*").eq("month_id", monthId),
    supabase
      .from("transactions")
      .select(
        `
        *,
        transaction_amounts (*)
      `,
      )
      .eq("month_id", monthId)
      .order("row_order", { ascending: true })
      .order("date", { ascending: true }),
  ]);

  if (monthRes.error) throw new Error(monthRes.error.message);
  if (obRes.error) throw new Error(obRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);

  if (!monthRes.data) return null;

  const month = monthRes.data as Month;
  const opening_balances = (obRes.data ?? []) as OpeningBalance[];
  const transactions = (txRes.data ?? []) as TransactionWithAmounts[];

  return { month, opening_balances, transactions };
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export async function createMonth(
  year: number,
  month: number,
  label?: string,
): Promise<Month> {
  const supabase = await createClient();
  const monthLabel =
    label ?? `${MONTH_NAMES[month - 1]} ${String(year).slice(-2)}`;

  const { data, error } = await supabase
    .from("months")
    .insert({ year, month, label: monthLabel })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Month;
}

export async function getPreviousMonthClosingBalances(
  year: number,
  month: number,
): Promise<{ account_id: string; account_name: string; balance: number }[]> {
  const supabase = await createClient();

  // Calculate previous month
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  // Get all active accounts
  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (accErr) throw new Error(accErr.message);
  if (!accounts || accounts.length === 0) return [];

  // Find the previous month
  const { data: prevMonthRow } = await supabase
    .from("months")
    .select("id")
    .eq("year", prevYear)
    .eq("month", prevMonth)
    .single();

  if (!prevMonthRow) {
    return accounts.map((a) => ({
      account_id: a.id,
      account_name: a.name,
      balance: 0,
    }));
  }

  // Get opening balances and transactions for previous month
  const [obRes, txRes] = await Promise.all([
    supabase
      .from("opening_balances")
      .select("account_id, amount")
      .eq("month_id", prevMonthRow.id),
    supabase
      .from("transactions")
      .select("transaction_amounts (account_id, amount)")
      .eq("month_id", prevMonthRow.id),
  ]);

  if (obRes.error) throw new Error(obRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);

  // Build balance map: opening_balance + sum(transaction_amounts)
  const balanceMap: Record<string, number> = {};
  for (const acc of accounts) {
    balanceMap[acc.id] = 0;
  }

  for (const ob of obRes.data ?? []) {
    balanceMap[ob.account_id] = (balanceMap[ob.account_id] ?? 0) + ob.amount;
  }

  for (const tx of txRes.data ?? []) {
    const amounts = (tx as { transaction_amounts: { account_id: string; amount: number }[] }).transaction_amounts;
    for (const ta of amounts ?? []) {
      balanceMap[ta.account_id] = (balanceMap[ta.account_id] ?? 0) + ta.amount;
    }
  }

  return accounts.map((a) => ({
    account_id: a.id,
    account_name: a.name,
    balance: balanceMap[a.id] ?? 0,
  }));
}

export async function createMonthWithBalances(
  year: number,
  month: number,
  balances: { account_id: string; amount: number }[],
  label?: string,
): Promise<Month> {
  const newMonth = await createMonth(year, month, label);

  const nonZero = balances.filter((b) => b.amount !== 0);
  if (nonZero.length > 0) {
    const supabase = await createClient();
    const rows = nonZero.map((b) => ({
      month_id: newMonth.id,
      account_id: b.account_id,
      amount: b.amount,
    }));

    const { error } = await supabase.from("opening_balances").insert(rows);
    if (error) throw new Error(error.message);
  }

  return newMonth;
}
