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
