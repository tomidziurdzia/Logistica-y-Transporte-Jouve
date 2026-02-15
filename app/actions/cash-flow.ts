"use server";

import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/db/types";

export type CashFlowMonth = { id: string; label: string };
export type CashFlowTotal = { category_id: string | null; month_id: string; total: number };
export type CashFlowSummary = {
  categories: Category[];
  months: CashFlowMonth[];
  totals: CashFlowTotal[];
};

const UNCATEGORIZED_ID = "__uncategorized__";

export async function getCashFlowSummary(
  monthIds: string[],
): Promise<CashFlowSummary | null> {
  if (monthIds.length === 0) return null;

  const supabase = await createClient();

  const [catRes, monthsRes, txRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, description, created_at")
      .order("name", { ascending: true }),
    supabase
      .from("months")
      .select("id, label")
      .in("id", monthIds),
    supabase
      .from("transactions")
      .select("id, month_id, category_id, transaction_amounts (amount)")
      .in("month_id", monthIds)
      .eq("type", "expense"),
  ]);

  if (catRes.error) throw new Error(catRes.error.message);
  if (monthsRes.error) throw new Error(monthsRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);

  const categories = (catRes.data ?? []) as Category[];
  const months = (monthsRes.data ?? []) as CashFlowMonth[];
  const transactions = txRes.data ?? [];

  const totalsMap = new Map<string, number>();

  for (const tx of transactions) {
    const amounts = (tx as { transaction_amounts: { amount: number }[] })
      .transaction_amounts;
    const total = (amounts ?? []).reduce((s, a) => s + Number(a.amount), 0);
    const categoryKey = tx.category_id ?? UNCATEGORIZED_ID;
    const key = `${categoryKey}|${tx.month_id}`;
    totalsMap.set(key, (totalsMap.get(key) ?? 0) + total);
  }

  const totals: CashFlowTotal[] = [];
  totalsMap.forEach((total, key) => {
    const [category_id, month_id] = key.split("|");
    totals.push({
      category_id: category_id === UNCATEGORIZED_ID ? null : category_id,
      month_id,
      total,
    });
  });

  const hasUncategorized = totals.some((t) => t.category_id === null);
  const categoriesWithNull = hasUncategorized
    ? [
        ...categories,
        {
          id: UNCATEGORIZED_ID,
          name: "Uncategorized",
          description: null,
          created_at: "",
        } as Category,
      ]
    : categories;

  return {
    categories: categoriesWithNull,
    months,
    totals,
  };
}
