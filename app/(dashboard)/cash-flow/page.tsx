"use client";

import { useMemo, useState } from "react";
import { useMonths } from "@/hooks/use-months";
import { useCashFlowSummary } from "@/hooks/use-cash-flow";
import { CashFlowSummaryTable } from "@/components/cash-flow-summary-table";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function CashFlowPage() {
  const { data: months, isLoading: loadingMonths } = useMonths();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sortedMonths = useMemo(
    () => (months ?? []).slice().sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    }),
    [months],
  );

  const defaultSelected = useMemo(() => {
    return sortedMonths.slice(0, 4).map((m) => m.id);
  }, [sortedMonths]);

  const effectiveSelected =
    selectedIds.length > 0 ? selectedIds : defaultSelected;

  const { data: summary, isLoading: loadingSummary } = useCashFlowSummary(
    effectiveSelected,
    true,
  );

  const toggleMonth = (id: string) => {
    setSelectedIds((prev) => {
      const base = prev.length === 0 ? defaultSelected : prev;
      return base.includes(id)
        ? base.filter((x) => x !== id)
        : [...base, id];
    });
  };

  if (loadingMonths) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Resumen flujo de fondos</h1>
        <p className="text-muted-foreground">Cargando períodos…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-hidden">
      <h1 className="text-2xl font-bold">Resumen flujo de fondos</h1>
      <p className="text-muted-foreground text-sm">
        Egresos por categoría. Seleccioná los meses a comparar.
      </p>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Label className="text-sm font-medium">Meses</Label>
          <div className="flex flex-wrap gap-4">
            {sortedMonths.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={effectiveSelected.includes(m.id)}
                  onCheckedChange={() => toggleMonth(m.id)}
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {loadingSummary ? (
        <p className="text-muted-foreground">Cargando resumen…</p>
      ) : summary ? (
        <CashFlowSummaryTable data={summary} />
      ) : (
        <p className="text-muted-foreground">
          No hay datos para los meses seleccionados.
        </p>
      )}
    </div>
  );
}
