"use client";

import { useQuery } from "@tanstack/react-query";
import { getIncomeCategories } from "@/app/actions/income-categories";

export function useIncomeCategories() {
  return useQuery({
    queryKey: ["income-categories"],
    queryFn: () => getIncomeCategories(),
  });
}
