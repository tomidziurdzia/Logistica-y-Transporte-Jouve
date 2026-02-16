"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useCashFlowMonthDetail } from "@/hooks/use-cash-flow";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NON_BUSINESS_CATEGORIES = ["Directores"];

export function CashFlowMonthDetailView({ monthId }: { monthId: string }) {
  const { data, isLoading, error } = useCashFlowMonthDetail(monthId);
  const [showNonBusiness, setShowNonBusiness] = useState(true);

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando detalle mensual...</p>;
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground">Mes no encontrado.</p>;
  }

  const filteredCategories = showNonBusiness
    ? data.categories
    : data.categories.filter(
        (c) => !NON_BUSINESS_CATEGORIES.includes(c.category_name)
      );

  const filteredBankCash = filteredCategories.reduce(
    (s, c) => s + c.bank_cash_total,
    0
  );
  const filteredCreditCard = filteredCategories.reduce(
    (s, c) => s + c.credit_card_total,
    0
  );
  const filteredTotal = filteredBankCash + filteredCreditCard;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <Link href="/cash-flow">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">
          Detalle Egresos — {data.month.label}
        </h1>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNonBusiness((v) => !v)}
            className="gap-1.5 text-xs"
          >
            {showNonBusiness ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {showNonBusiness ? "Ocultar no operativos" : "Mostrar todos"}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Bancos / Efectivo</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatCurrency(filteredBankCash)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Tarjeta Crédito</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatCurrency(filteredCreditCard)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Egresos</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatCurrency(filteredTotal)}
          </p>
        </Card>
      </div>

      {/* Detail table */}
      <Card className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b bg-muted/50">
              <th className="min-w-[250px] px-3 py-2 text-left text-xs font-semibold">
                CATEGORÍA / SUBCATEGORÍA
              </th>
              <th className="min-w-[130px] px-3 py-2 text-right text-xs font-semibold">
                BANCOS / EFECTIVO
              </th>
              <th className="min-w-[130px] px-3 py-2 text-right text-xs font-semibold">
                TARJETA CRÉDITO
              </th>
              <th className="min-w-[130px] px-3 py-2 text-right text-xs font-semibold">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat) => (
              <>
                {/* Category header row */}
                <tr
                  key={`cat-${cat.category_id}`}
                  className="border-b bg-muted/30 font-semibold"
                >
                  <td className="px-3 py-2 text-xs uppercase tracking-wide">
                    {cat.category_name}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">
                    {cat.bank_cash_total !== 0
                      ? formatCurrency(cat.bank_cash_total)
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">
                    {cat.credit_card_total !== 0
                      ? formatCurrency(cat.credit_card_total)
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">
                    {formatCurrency(cat.total)}
                  </td>
                </tr>
                {/* Subcategory rows */}
                {cat.subcategories.map((sub) => (
                  <tr
                    key={`sub-${sub.subcategory_id ?? "none"}`}
                    className="border-b hover:bg-muted/20"
                  >
                    <td className="px-3 py-1.5 pl-8 text-xs text-muted-foreground">
                      {sub.subcategory_name}
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs tabular-nums">
                      {sub.bank_cash !== 0 ? formatCurrency(sub.bank_cash) : "-"}
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs tabular-nums">
                      {sub.credit_card !== 0
                        ? formatCurrency(sub.credit_card)
                        : "-"}
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs tabular-nums">
                      {sub.total !== 0 ? formatCurrency(sub.total) : "-"}
                    </td>
                  </tr>
                ))}
              </>
            ))}

            {/* Grand total */}
            <tr className="border-t-2 bg-primary/10 font-bold">
              <td className="px-3 py-2 text-xs">TOTAL EGRESOS</td>
              <td className="px-3 py-2 text-right text-xs tabular-nums">
                {formatCurrency(filteredBankCash)}
              </td>
              <td className="px-3 py-2 text-right text-xs tabular-nums">
                {formatCurrency(filteredCreditCard)}
              </td>
              <td className="px-3 py-2 text-right text-xs tabular-nums">
                {formatCurrency(filteredTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
