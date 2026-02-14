"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMonthData } from "@/hooks/use-month-data";
import { useAccounts } from "@/hooks/use-accounts";
import type { MonthData } from "@/lib/db/types";
import { formatCurrency } from "@/lib/format";
import { MonthTransactionsTable } from "@/components/month-transactions-table";
import { Card } from "@/components/ui/card";
import { useCategories } from "@/hooks/use-categories";

const loadingPlaceholder = (
  <p className="text-muted-foreground">Loading month…</p>
);

function useMonthSummary(data: MonthData | null | undefined) {
  return useMemo(() => {
    if (!data) return null;
    const { opening_balances, transactions } = data;
    const openingBalance = opening_balances.reduce((s, ob) => s + ob.amount, 0);
    let incomeTotal = 0;
    let expenseTotal = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let closingBalance = openingBalance;
    for (const tx of transactions) {
      const total = tx.transaction_amounts.reduce((s, a) => s + a.amount, 0);
      if (tx.type === "income") {
        incomeTotal += total;
        incomeCount++;
      } else if (tx.type === "expense") {
        expenseTotal += Math.abs(total);
        expenseCount++;
      }
      closingBalance += total;
    }
    return {
      openingBalance,
      incomeTotal,
      expenseTotal,
      closingBalance,
      incomeCount,
      expenseCount,
    };
  }, [data]);
}

function useAccountBalances(
  data: MonthData | null | undefined,
  accounts: { id: string }[] | undefined
) {
  return useMemo(() => {
    if (!data || !accounts?.length) return [];
    const { opening_balances, transactions } = data;
    const byAccount = new Map<string, number>();
    for (const ob of opening_balances) {
      byAccount.set(
        ob.account_id,
        (byAccount.get(ob.account_id) ?? 0) + ob.amount
      );
    }
    for (const tx of transactions) {
      for (const ta of tx.transaction_amounts) {
        byAccount.set(
          ta.account_id,
          (byAccount.get(ta.account_id) ?? 0) + ta.amount
        );
      }
    }
    return accounts.map((acc) => ({
      id: acc.id,
      balance: byAccount.get(acc.id) ?? 0,
    }));
  }, [data, accounts]);
}

export function MonthView({ monthId }: { monthId: string }) {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, error } = useMonthData(monthId);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const summary = useMonthSummary(data);
  const accountBalances = useAccountBalances(data, accounts);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return loadingPlaceholder;
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground">Month not found.</p>;
  }

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
      {/* Fixed cards (no scroll) */}
      <div className="min-h-0 space-y-4 overflow-hidden">
        {/* Balance per account (small cards) */}
        {accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {accounts.map((acc) => {
              const row = accountBalances.find((r) => r.id === acc.id);
              const balance = row?.balance ?? 0;
              return (
                <Card key={acc.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted-foreground">
                        {acc.name}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">
                        {formatCurrency(balance)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No accounts loaded.</p>
        )}

        {/* Summary cards (compact) */}
        {summary && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Opening Balance
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatCurrency(summary.openingBalance)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    At start of month
                  </p>
                </div>
                <Wallet className="size-3.5 shrink-0 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Income
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatCurrency(summary.incomeTotal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {summary.incomeCount} transactions
                  </p>
                </div>
                <TrendingUp className="size-3.5 shrink-0 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Expenses
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatCurrency(summary.expenseTotal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {summary.expenseCount} transactions
                  </p>
                </div>
                <TrendingDown className="size-3.5 shrink-0 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Closing Balance
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {formatCurrency(summary.closingBalance)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Estimated at close
                  </p>
                </div>
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Editable table: add rows, edit inline, Save changes */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {accounts && accounts.length > 0 ? (
          <MonthTransactionsTable
            monthId={monthId}
            accounts={accounts}
            categories={categories ?? []}
            transactions={data.transactions ?? []}
            nextRowOrder={
              (data.transactions?.length ?? 0) > 0
                ? Math.max(
                    ...(data.transactions ?? []).map((t) => t.row_order),
                    -1
                  ) + 1
                : 0
            }
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No accounts loaded. Add accounts to manage transactions.
          </p>
        )}
      </div>
    </div>
  );
}
