"use client";

import type { CashFlowSummary } from "@/app/actions/cash-flow";
import { formatCurrency } from "@/lib/format";

type CashFlowSummaryTableProps = {
  data: CashFlowSummary;
};

const UNCATEGORIZED_ID = "__uncategorized__";

export function CashFlowSummaryTable({ data }: CashFlowSummaryTableProps) {
  const { categories, months, totals } = data;
  const totalByMonth = new Map<string, number>();
  const totalByCategory = new Map<string, number>();

  for (const m of months) {
    totalByMonth.set(m.id, 0);
  }
  for (const cat of categories) {
    const key = cat.id === UNCATEGORIZED_ID ? UNCATEGORIZED_ID : cat.id;
    totalByCategory.set(key, 0);
  }
  for (const t of totals) {
    totalByMonth.set(t.month_id, (totalByMonth.get(t.month_id) ?? 0) + t.total);
    const catKey = t.category_id ?? UNCATEGORIZED_ID;
    totalByCategory.set(catKey, (totalByCategory.get(catKey) ?? 0) + t.total);
  }

  const getTotal = (categoryId: string | null, monthId: string) => {
    const row = totals.find(
      (t) =>
        (t.category_id ?? UNCATEGORIZED_ID) === (categoryId ?? UNCATEGORIZED_ID) &&
        t.month_id === monthId,
    );
    return row?.total ?? 0;
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const keyA = a.id === UNCATEGORIZED_ID ? UNCATEGORIZED_ID : a.id;
    const keyB = b.id === UNCATEGORIZED_ID ? UNCATEGORIZED_ID : b.id;
    const totalA = totalByCategory.get(keyA) ?? 0;
    const totalB = totalByCategory.get(keyB) ?? 0;
    return totalA - totalB;
  });

  const grandTotal = [...totalByCategory.values()].reduce((s, v) => s + v, 0);

  return (
    <div className="overflow-x-auto rounded-md border bg-[#faf8f5]">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-foreground">
              Categoría
            </th>
            {months.map((m) => (
              <th
                key={m.id}
                className="px-4 py-3 text-right font-medium text-foreground"
              >
                {m.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium text-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCategories.map((cat) => {
            const catKey = cat.id === UNCATEGORIZED_ID ? UNCATEGORIZED_ID : cat.id;
            const rowTotal = totalByCategory.get(catKey) ?? 0;
            return (
              <tr key={cat.id} className="border-b last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {cat.name}
                </td>
                {months.map((m) => {
                  const value = getTotal(cat.id === UNCATEGORIZED_ID ? null : cat.id, m.id);
                  return (
                    <td
                      key={m.id}
                      className={`px-4 py-2.5 text-right tabular-nums ${
                        value < 0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {formatCurrency(value)}
                    </td>
                  );
                })}
                <td
                  className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                    rowTotal < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {formatCurrency(rowTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-foreground/20 bg-muted/30 font-semibold">
            <td className="px-4 py-3 font-medium">SUBTOTAL</td>
            {months.map((m) => {
              const subtotal = totalByMonth.get(m.id) ?? 0;
              return (
                <td
                  key={m.id}
                  className={`px-4 py-3 text-right tabular-nums ${
                    subtotal < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {formatCurrency(subtotal)}
                </td>
              );
            })}
            <td
              className={`px-4 py-3 text-right tabular-nums ${
                grandTotal < 0 ? "text-destructive" : "text-foreground"
              }`}
            >
              {formatCurrency(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
