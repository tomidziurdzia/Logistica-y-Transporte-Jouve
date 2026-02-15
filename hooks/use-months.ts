"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  createMonth,
  createMonthWithBalances,
  getMonths,
  getPreviousMonthClosingBalances,
} from "@/app/actions/months";

export const monthsQueryKey = ["months"] as const;

export function useMonths() {
  return useQuery({
    queryKey: monthsQueryKey,
    queryFn: () => getMonths(),
  });
}

export function useCreateMonth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      year,
      month,
      label,
    }: {
      year: number;
      month: number;
      label?: string;
    }) => createMonth(year, month, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monthsQueryKey });
    },
  });
}

export function usePreviousMonthBalances(year: number, month: number, enabled: boolean) {
  return useQuery({
    queryKey: ["previousMonthBalances", year, month],
    queryFn: () => getPreviousMonthClosingBalances(year, month),
    enabled,
  });
}

export function useCreateMonthWithBalances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      year,
      month,
      balances,
      label,
    }: {
      year: number;
      month: number;
      balances: { account_id: string; amount: number }[];
      label?: string;
    }) => createMonthWithBalances(year, month, balances, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monthsQueryKey });
    },
  });
}
