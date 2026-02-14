import Link from "next/link";
import { Suspense } from "react";
import { HomeContent } from "@/app/home-content";

function HomeFallback() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <Link href="/" className="font-semibold">
              Logística y Transporte Jouve
            </Link>
            <div className="flex gap-4">
              <Link href="/auth/login" className="hover:underline">
                Iniciar sesión
              </Link>
              <Link href="/auth/sign-up" className="hover:underline">
                Registrarse
              </Link>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-12 max-w-5xl p-5 text-center">
          <p className="text-muted-foreground">Cargando…</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
