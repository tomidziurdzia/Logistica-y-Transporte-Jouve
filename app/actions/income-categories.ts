"use server";

import { createClient } from "@/lib/supabase/server";
import type { IncomeCategory } from "@/lib/db/types";

export async function getIncomeCategories(): Promise<IncomeCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income_categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as IncomeCategory[];
}
