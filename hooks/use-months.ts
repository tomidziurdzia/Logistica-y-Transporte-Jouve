"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { createMonth, getMonths } from "@/app/actions/months";

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
