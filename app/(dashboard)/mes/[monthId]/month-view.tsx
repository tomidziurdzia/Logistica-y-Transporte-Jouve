"use client";

import { useEffect, useState } from "react";
import { useMonthData } from "@/hooks/use-month-data";

const loadingPlaceholder = (
  <p className="text-muted-foreground">Cargando mes…</p>
);

export function MonthView({ monthId }: { monthId: string }) {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, error } = useMonthData(monthId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return loadingPlaceholder;
  }

  if (isLoading) {
    return loadingPlaceholder;
  }

  if (error) {
    return (
      <p className="text-destructive">
        Error: {error.message}
      </p>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Mes no encontrado.</p>;
  }

  const { month, opening_balances, transactions } = data;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{month.label}</h1>
      <p className="text-sm text-muted-foreground">
        Saldos iniciales: {opening_balances.length} cuenta(s) · Movimientos:{" "}
        {transactions.length}
      </p>
      {/* Tabla de movimientos en el siguiente paso */}
    </div>
  );
}
