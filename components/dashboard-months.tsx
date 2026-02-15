"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMonths } from "@/hooks/use-months";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { NewMonthModal } from "@/components/new-month-modal";

const loadingPlaceholder = (
  <p className="text-muted-foreground">Loading months…</p>
);

export function DashboardMonths() {
  const [mounted, setMounted] = useState(false);
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const { data: months, isLoading, error } = useMonths();
  const router = useRouter();

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

  const now = new Date();
  const nextMonth = months && months.length > 0
    ? (() => {
        const latest = months[0];
        const m = latest.month === 12 ? 1 : latest.month + 1;
        const y = latest.month === 12 ? latest.year + 1 : latest.year;
        return { year: y, month: m };
      })()
    : { year: now.getFullYear(), month: now.getMonth() + 1 };

  if (!months || months.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground">No months loaded.</p>
        <Button onClick={() => setShowNewMonthModal(true)}>
          <CalendarPlus className="size-4" />
          Create current month
        </Button>
        {showNewMonthModal && (
          <NewMonthModal
            year={nextMonth.year}
            month={nextMonth.month}
            onClose={() => setShowNewMonthModal(false)}
            onCreated={(monthId) => {
              setShowNewMonthModal(false);
              router.push(`/month/${monthId}`);
            }}
          />
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
