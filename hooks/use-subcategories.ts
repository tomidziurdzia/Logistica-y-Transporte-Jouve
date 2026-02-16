"use client";

import { useQuery } from "@tanstack/react-query";
import { getSubcategories } from "@/app/actions/subcategories";

export function useSubcategories() {
  return useQuery({
    queryKey: ["subcategories"],
    queryFn: () => getSubcategories(),
  });
}
