import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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

async function HomePageContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
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

  return (
    <div className="flex flex-col gap-12 max-w-4xl text-center">
      <h1 className="text-3xl font-bold">Logística y Transporte Jouve</h1>
      <p className="text-muted-foreground max-w-xl mx-auto">
        Bienvenido. Inicia sesión o regístrate para acceder.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/auth/login"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-md border px-4 py-2 hover:bg-accent"
        >
          Registrarse
        </Link>
      </div>
    </div>
  );
}

function HomeFallback() {
  return (
    <div className="flex flex-col gap-12 max-w-4xl text-center">
      <p className="text-muted-foreground">Cargando…</p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/auth/login"
          className="rounded-md border px-4 py-2 hover:bg-accent"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-md border px-4 py-2 hover:bg-accent"
        >
          Registrarse
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
