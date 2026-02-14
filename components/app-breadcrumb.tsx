"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useMonthData } from "@/hooks/use-month-data";

export function AppBreadcrumb() {
  const pathname = usePathname();
  const monthIdMatch = pathname.match(/^\/mes\/([a-f0-9-]+)$/i);
  const monthId = monthIdMatch?.[1] ?? null;
  const { data: monthData } = useMonthData(monthId);

  if (pathname === "/") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Inicio</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  if (pathname.startsWith("/mes/") && monthId) {
    const monthLabel = monthData?.month?.label ?? "Mes";
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
              Inicio
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{monthLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            Inicio
          </Link>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{pathname.slice(1) || "Inicio"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
