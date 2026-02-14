"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "@/app/actions/transactions";
import { monthDataQueryKey } from "./use-month-data";
import { monthsQueryKey } from "./use-months";

export function useCreateTransaction(monthId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monthDataQueryKey(monthId) });
      queryClient.invalidateQueries({ queryKey: monthsQueryKey });
    },
  });
}

export function useUpdateTransaction(monthId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTransactionInput) => updateTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monthDataQueryKey(monthId) });
      queryClient.invalidateQueries({ queryKey: monthsQueryKey });
    },
  });
}

export function useDeleteTransaction(monthId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) => deleteTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monthDataQueryKey(monthId) });
      queryClient.invalidateQueries({ queryKey: monthsQueryKey });
    },
  });
}
