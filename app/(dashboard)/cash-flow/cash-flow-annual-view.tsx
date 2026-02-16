"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCashFlowAnnual } from "@/hooks/use-cash-flow";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import type { CashFlowMonthColumn, CashFlowCategoryRow, CashFlowBalanceRow } from "@/lib/db/types";

function getFiscalDefaults() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return {
    startYear: month >= 10 ? year : year - 1,
    startMonth: 10,
    endYear: month >= 10 ? year + 1 : year,
    endMonth: 9,
  };
}

function MonthHeader({ months }: { months: CashFlowMonthColumn[] }) {
  return (
    <tr className="border-b bg-muted/50">
      <th className="sticky left-0 z-10 min-w-[200px] bg-muted/50 px-3 py-2 text-left text-xs font-semibold">
        CONCEPTO
      </th>
      {months.map((m) => (
        <th
          key={m.month_id}
          className="min-w-[120px] px-3 py-2 text-right text-xs font-semibold"
        >
          {m.label}
        </th>
      ))}
      <th className="min-w-[120px] px-3 py-2 text-right text-xs font-semibold">
        TOTAL
      </th>
    </tr>
  );
}

function BalanceRows({
  rows,
  totals,
  totalLabel,
}: {
  rows: CashFlowBalanceRow[];
  totals: CashFlowMonthColumn[];
  totalLabel: string;
}) {
  return (
    <>
      {rows.map((row) => (
        <tr key={row.account_id} className="border-b hover:bg-muted/30">
          <td className="sticky left-0 z-10 bg-background px-3 py-1.5 text-xs">
            {row.account_name}
          </td>
          {row.months.map((m) => (
            <td
              key={m.month_id}
              className="px-3 py-1.5 text-right text-xs tabular-nums"
            >
              {m.amount !== 0 ? formatCurrency(m.amount) : "-"}
            </td>
          ))}
          <td className="px-3 py-1.5 text-right text-xs font-medium tabular-nums">
            {formatCurrency(row.total)}
          </td>
        </tr>
      ))}
      <tr className="border-b bg-muted/30 font-semibold">
        <td className="sticky left-0 z-10 bg-muted/30 px-3 py-1.5 text-xs">
          {totalLabel}
        </td>
        {totals.map((m) => (
          <td
            key={m.month_id}
            className="px-3 py-1.5 text-right text-xs tabular-nums"
          >
            {formatCurrency(m.amount)}
          </td>
        ))}
        <td className="px-3 py-1.5 text-right text-xs tabular-nums">
          {formatCurrency(totals.reduce((s, c) => s + c.amount, 0))}
        </td>
      </tr>
    </>
  );
}

function CategoryRows({
  rows,
  totals,
  totalLabel,
  linkPrefix,
  months,
}: {
  rows: CashFlowCategoryRow[];
  totals: CashFlowMonthColumn[];
  totalLabel: string;
  linkPrefix?: string;
  months?: CashFlowMonthColumn[];
}) {
  return (
    <>
      {rows.map((row) => (
        <tr key={row.category_id ?? "unclassified"} className="border-b hover:bg-muted/30">
          <td className="sticky left-0 z-10 bg-background px-3 py-1.5 text-xs">
            {row.category_name}
          </td>
          {row.months.map((m) => (
            <td
              key={m.month_id}
              className="px-3 py-1.5 text-right text-xs tabular-nums"
            >
              {m.amount !== 0 ? (
                linkPrefix ? (
                  <Link
                    href={`${linkPrefix}/${m.month_id}`}
                    className="text-primary hover:underline"
                  >
                    {formatCurrency(m.amount)}
                  </Link>
                ) : (
                  formatCurrency(m.amount)
                )
              ) : (
                "-"
              )}
            </td>
          ))}
          <td className="px-3 py-1.5 text-right text-xs font-medium tabular-nums">
            {row.total !== 0 ? formatCurrency(row.total) : "-"}
          </td>
        </tr>
      ))}
      <tr className="border-b bg-muted/30 font-semibold">
        <td className="sticky left-0 z-10 bg-muted/30 px-3 py-1.5 text-xs">
          {totalLabel}
        </td>
        {totals.map((m) => (
          <td
            key={m.month_id}
            className="px-3 py-1.5 text-right text-xs tabular-nums"
          >
            {formatCurrency(m.amount)}
          </td>
        ))}
        <td className="px-3 py-1.5 text-right text-xs tabular-nums">
          {formatCurrency(totals.reduce((s, c) => s + c.amount, 0))}
        </td>
      </tr>
    </>
  );
}

function ResultRow({
  label,
  months,
  className,
}: {
  label: string;
  months: CashFlowMonthColumn[];
  className?: string;
}) {
  return (
    <tr className={`border-b font-bold ${className ?? "bg-primary/10"}`}>
      <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-xs">
        {label}
      </td>
      {months.map((m) => (
        <td
          key={m.month_id}
          className={`px-3 py-2 text-right text-xs tabular-nums ${
            m.amount < 0 ? "text-destructive" : ""
          }`}
        >
          {formatCurrency(m.amount)}
        </td>
      ))}
      <td
        className={`px-3 py-2 text-right text-xs tabular-nums ${
          months.reduce((s, c) => s + c.amount, 0) < 0 ? "text-destructive" : ""
        }`}
      >
        {formatCurrency(months.reduce((s, c) => s + c.amount, 0))}
      </td>
    </tr>
  );
}

export function CashFlowAnnualView() {
  const defaults = useMemo(() => getFiscalDefaults(), []);
  const [startYear] = useState(defaults.startYear);
  const [startMonth] = useState(defaults.startMonth);
  const [endYear] = useState(defaults.endYear);
  const [endMonth] = useState(defaults.endMonth);

  const { data, isLoading, error } = useCashFlowAnnual(
    startYear,
    startMonth,
    endYear,
    endMonth
  );

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando flujo de fondos...</p>;
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!data || data.months.length === 0) {
    return (
      <p className="text-muted-foreground">
        No hay datos para el período seleccionado. Cree períodos mensuales y registre transacciones primero.
      </p>
    );
  }

  const monthCols = data.months.map((m) => ({
    month_id: m.id,
    label: m.label,
    amount: 0,
  }));

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Flujo de Fondos</h1>
        <p className="text-xs text-muted-foreground">
          {data.months[0]?.label} — {data.months[data.months.length - 1]?.label}
        </p>
      </div>

      <Card className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <MonthHeader months={monthCols.map((c, i) => ({ ...c, ...data.months[i] ? { month_id: data.months[i].id, label: data.months[i].label } : {} }))} />
          </thead>
          <tbody>
            {/* SALDO INICIAL */}
            <tr className="bg-muted/60">
              <td
                colSpan={data.months.length + 2}
                className="sticky left-0 z-10 bg-muted/60 px-3 py-2 text-xs font-bold uppercase tracking-wide"
              >
                Saldo Inicial
              </td>
            </tr>
            <BalanceRows
              rows={data.opening_balances}
              totals={data.opening_total}
              totalLabel="SUBTOTAL"
            />

            {/* ENTRADAS */}
            <tr className="bg-green-50 dark:bg-green-950/30">
              <td
                colSpan={data.months.length + 2}
                className="sticky left-0 z-10 bg-green-50 px-3 py-2 text-xs font-bold uppercase tracking-wide dark:bg-green-950/30"
              >
                Entradas
              </td>
            </tr>
            <CategoryRows
              rows={data.income_rows}
              totals={data.income_total}
              totalLabel="SUBTOTAL ENTRADAS"
            />

            {/* SALIDAS */}
            <tr className="bg-red-50 dark:bg-red-950/30">
              <td
                colSpan={data.months.length + 2}
                className="sticky left-0 z-10 bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-wide dark:bg-red-950/30"
              >
                Salidas
              </td>
            </tr>
            <CategoryRows
              rows={data.expense_rows}
              totals={data.expense_total}
              totalLabel="SUBTOTAL SALIDAS"
              linkPrefix="/cash-flow/month"
            />

            {/* RESULTADO */}
            <ResultRow label="RESULTADO" months={data.result} />

            {/* SALDO DE CIERRE */}
            <tr className="bg-muted/60">
              <td
                colSpan={data.months.length + 2}
                className="sticky left-0 z-10 bg-muted/60 px-3 py-2 text-xs font-bold uppercase tracking-wide"
              >
                Saldo de Cierre
              </td>
            </tr>
            <BalanceRows
              rows={data.closing_balances}
              totals={data.closing_total}
              totalLabel="TOTAL"
            />
          </tbody>
        </table>
      </Card>
    </div>
  );
}
