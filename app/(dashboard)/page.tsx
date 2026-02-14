import { Suspense } from "react";
import { DashboardMonths } from "@/components/dashboard-months";

async function DashboardContent() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">Períodos</h2>
        <DashboardMonths />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground">Cargando…</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
