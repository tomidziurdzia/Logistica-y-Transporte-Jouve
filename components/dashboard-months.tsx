"use client";

import { useEffect, useState } from "react";
import { useMonths, useCreateMonth } from "@/hooks/use-months";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

const loadingPlaceholder = (
  <p className="text-muted-foreground">Loading months…</p>
);

export function DashboardMonths() {
  const [mounted, setMounted] = useState(false);
  const { data: months, isLoading, error } = useMonths();
  const createMonth = useCreateMonth();

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
      <p className="text-destructive text-sm">
        Error loading months: {error.message}
      </p>
    );
  }

  if (!months || months.length === 0) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground">No months loaded.</p>
        <Button
          onClick={() => createMonth.mutate({ year, month })}
          disabled={createMonth.isPending}
        >
          <CalendarPlus className="size-4" />
          {createMonth.isPending ? "Creating…" : "Create current month"}
        </Button>
        {createMonth.isError && (
          <p className="text-destructive text-sm">
            {createMonth.error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold text-lg">Months</h2>
      <ul className="flex flex-col gap-1">
        {months.map((m) => (
          <li key={m.id} className="text-sm">
            {m.label}
            {m.is_closed && (
              <span className="ml-2 text-muted-foreground">(closed)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
