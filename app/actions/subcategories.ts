"use server";

import { createClient } from "@/lib/supabase/server";
import type { Subcategory } from "@/lib/db/types";

export async function getSubcategories(): Promise<Subcategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Subcategory[];
}
