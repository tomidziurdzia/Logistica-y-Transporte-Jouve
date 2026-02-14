"use client";

import { useQuery } from "@tanstack/react-query";
import { getMonths } from "@/app/actions/months";

export const monthsQueryKey = ["months"] as const;

export function useMonths() {
  return useQuery({
    queryKey: monthsQueryKey,
    queryFn: () => getMonths(),
  });
}
