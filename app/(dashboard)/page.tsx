import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { Suspense } from "react";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  return (
    <pre className="text-xs font-mono whitespace-pre-wrap">
      {JSON.stringify(data.claims, null, 2)}
    </pre>
  );
}

async function DashboardContent() {
  return (
    <div className="flex flex-col gap-12">
      <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
        <InfoIcon size={16} strokeWidth={2} />
        Estás conectado. Aquí tienes tu información de usuario.
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Tus datos de usuario</h2>
        <div className="p-3 rounded border max-h-48 overflow-auto w-full">
          <Suspense
            fallback={
              <span className="text-muted-foreground">Cargando…</span>
            }
          >
            <UserDetails />
          </Suspense>
        </div>
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
