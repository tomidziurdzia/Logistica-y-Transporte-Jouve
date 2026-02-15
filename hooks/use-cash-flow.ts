"use client";

import { useQuery } from "@tanstack/react-query";
import { getCashFlowSummary } from "@/app/actions/cash-flow";

export function cashFlowQueryKey(monthIds: string[]) {
  return ["cashFlowSummary", [...monthIds].sort().join(",")] as const;
}

export function useCashFlowSummary(monthIds: string[], enabled: boolean) {
  return useQuery({
    queryKey: cashFlowQueryKey(monthIds),
    queryFn: () => getCashFlowSummary(monthIds),
    enabled: enabled && monthIds.length > 0,
  });
}
