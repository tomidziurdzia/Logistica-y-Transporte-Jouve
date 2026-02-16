"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCashFlowAnnual,
  getCashFlowMonthDetail,
  getIncomeStatement,
} from "@/app/actions/cash-flow";

export function useCashFlowAnnual(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
) {
  return useQuery({
    queryKey: ["cash-flow-annual", startYear, startMonth, endYear, endMonth],
    queryFn: () => getCashFlowAnnual(startYear, startMonth, endYear, endMonth),
  });
}

export function useCashFlowMonthDetail(monthId: string | null) {
  return useQuery({
    queryKey: ["cash-flow-month-detail", monthId],
    queryFn: () => getCashFlowMonthDetail(monthId!),
    enabled: !!monthId,
  });
}

export function useIncomeStatement(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  accrualBasis: boolean = false,
  excludeNonBusiness: boolean = false
) {
  return useQuery({
    queryKey: [
      "income-statement",
      startYear, startMonth, endYear, endMonth,
      accrualBasis, excludeNonBusiness,
    ],
    queryFn: () =>
      getIncomeStatement(
        startYear, startMonth, endYear, endMonth,
        accrualBasis, excludeNonBusiness
      ),
  });
}
