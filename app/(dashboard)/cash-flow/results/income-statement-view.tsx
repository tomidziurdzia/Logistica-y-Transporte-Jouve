"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useIncomeStatement } from "@/hooks/use-cash-flow";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { IncomeStatementRow } from "@/lib/db/types";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const DEFAULT_START_YEAR = CURRENT_MONTH >= 10 ? CURRENT_YEAR : CURRENT_YEAR - 1;
const DEFAULT_START_MONTH = 10;
const DEFAULT_END_YEAR = CURRENT_MONTH >= 10 ? CURRENT_YEAR + 1 : CURRENT_YEAR;
const DEFAULT_END_MONTH = 9;

function StatementRow({
  row,
  bold,
  className,
}: {
  row: IncomeStatementRow;
  bold?: boolean;
  className?: string;
}) {
  return (
    <tr className={`border-b ${className ?? ""} ${bold ? "font-semibold" : ""}`}>
      <td
        className={`sticky left-0 z-10 px-3 py-1.5 text-xs ${
          bold ? "bg-inherit" : "bg-background"
        }`}
      >
        {row.label}
      </td>
      {row.months.map((m) => (
        <td
          key={m.month_id}
          className={`px-3 py-1.5 text-right text-xs tabular-nums ${
            m.amount < 0 ? "text-destructive" : ""
          }`}
        >
          {m.amount !== 0 ? formatCurrency(m.amount) : "-"}
        </td>
      ))}
      <td
        className={`px-3 py-1.5 text-right text-xs tabular-nums ${
          row.total < 0 ? "text-destructive" : ""
        }`}
      >
        {formatCurrency(row.total)}
      </td>
    </tr>
  );
}

export function IncomeStatementView() {
  const [accrualBasis, setAccrualBasis] = useState(false);
  const [excludeNonBusiness, setExcludeNonBusiness] = useState(false);

  const { data, isLoading, error } = useIncomeStatement(
    DEFAULT_START_YEAR,
    DEFAULT_START_MONTH,
    DEFAULT_END_YEAR,
    DEFAULT_END_MONTH,
    accrualBasis,
    excludeNonBusiness
  );

  if (isLoading) {
    return (
      <p className="text-muted-foreground">Cargando estado de resultados...</p>
    );
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!data || data.months.length === 0) {
    return (
      <p className="text-muted-foreground">
        No hay datos para el período seleccionado.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <Link href="/cash-flow">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Estado de Resultados</h1>
        <p className="text-xs text-muted-foreground">
          {data.months[0]?.label} — {data.months[data.months.length - 1]?.label}
        </p>
      </div>

      {/* Toggle controls */}
      <div className="flex gap-2">
        <Button
          variant={accrualBasis ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setAccrualBasis((v) => !v)}
        >
          {accrualBasis ? "Criterio: Devengado" : "Criterio: Pagado"}
        </Button>
        <Button
          variant={excludeNonBusiness ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setExcludeNonBusiness((v) => !v)}
        >
          {excludeNonBusiness
            ? "Sin gastos no operativos"
            : "Incluye todos los gastos"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Ingresos</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-green-600 dark:text-green-400">
            {formatCurrency(data.income_total.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Egresos</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatCurrency(data.expense_total.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Resultado Neto</p>
          <p
            className={`mt-1 text-lg font-semibold tabular-nums ${
              data.net_result.total >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-destructive"
            }`}
          >
            {formatCurrency(data.net_result.total)}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 min-w-[200px] bg-muted/50 px-3 py-2 text-left text-xs font-semibold">
                CONCEPTO
              </th>
              {data.months.map((m) => (
                <th
                  key={m.id}
                  className="min-w-[120px] px-3 py-2 text-right text-xs font-semibold"
                >
                  {m.label}
                </th>
              ))}
              <th className="min-w-[120px] px-3 py-2 text-right text-xs font-semibold">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Income section */}
            <tr className="bg-green-50 dark:bg-green-950/30">
              <td
                colSpan={data.months.length + 2}
                className="sticky left-0 z-10 bg-green-50 px-3 py-2 text-xs font-bold uppercase tracking-wide dark:bg-green-950/30"
              >
                Ingresos
              </td>
            </tr>
            {data.income_rows.map((row) => (
              <StatementRow key={row.label} row={row} />
            ))}
            <StatementRow
              row={data.income_total}
              bold
              className="bg-green-50/50 dark:bg-green-950/20"
            />

            {/* Expense section */}
            <tr className="bg-red-50 dark:bg-red-950/30">
              <td
                colSpan={data.months.length + 2}
                className="sticky left-0 z-10 bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-wide dark:bg-red-950/30"
              >
                Egresos
              </td>
            </tr>
            {data.expense_rows.map((row) => (
              <StatementRow key={row.label} row={row} />
            ))}
            <StatementRow
              row={data.expense_total}
              bold
              className="bg-red-50/50 dark:bg-red-950/20"
            />

            {/* Net result */}
            <StatementRow
              row={data.net_result}
              bold
              className="bg-primary/10"
            />
          </tbody>
        </table>
      </Card>
    </div>
  );
}
