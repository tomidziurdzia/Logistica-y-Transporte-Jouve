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

export async function HomeContent() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const nav = (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <Link href="/" className="font-semibold">
          Logística y Transporte Jouve
        </Link>
        <div className="flex gap-4">
          {session ? (
            <a href="/auth/logout" className="hover:underline">
              Cerrar sesión
            </a>
          ) : (
            <>
              <Link href="/auth/login" className="hover:underline">
                Iniciar sesión
              </Link>
              <Link href="/auth/sign-up" className="hover:underline">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );

  if (session) {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          {nav}
          <div className="flex-1 flex flex-col gap-12 max-w-5xl p-5 w-full">
            <div className="w-full">
              <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
                <InfoIcon size={16} strokeWidth={2} />
                Estás conectado. Aquí tienes tu información de usuario.
              </div>
            </div>
            <div className="flex flex-col gap-2 items-start">
              <h2 className="font-bold text-2xl mb-4">Tus datos de usuario</h2>
              <div className="p-3 rounded border max-h-48 overflow-auto w-full">
                <Suspense fallback={<span className="text-muted-foreground">Cargando…</span>}>
                  <UserDetails />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        {nav}
        <div className="flex-1 flex flex-col gap-12 max-w-5xl p-5 text-center">
          <h1 className="text-3xl font-bold">Logística y Transporte Jouve</h1>
          <p className="text-muted-foreground max-w-xl">
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
      </div>
    </main>
  );
}
