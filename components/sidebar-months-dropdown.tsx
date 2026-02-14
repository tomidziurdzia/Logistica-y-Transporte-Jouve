"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calendar,
  CalendarPlus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useMonths, useCreateMonth } from "@/hooks/use-months";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function SidebarMonthsDropdown() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: months, isLoading } = useMonths();
  const createMonth = useCreateMonth();

  const monthIdMatch = pathname.match(/^\/mes\/([a-f0-9-]+)$/i);
  const currentMonthId = monthIdMatch?.[1] ?? null;

  // Abrir al estar en una ruta de mes
  useEffect(() => {
    if (currentMonthId) setOpen(true);
  }, [currentMonthId]);

  const handleCreateMonth = () => {
    const now = new Date();
    createMonth.mutate(
      { year: now.getFullYear(), month: now.getMonth() + 1 },
      {
        onSuccess: (month) => {
          router.push(`/mes/${month.id}`);
        },
      }
    );
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip="Meses"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer"
      >
        <Calendar className="size-4" />
        <span className="truncate">Meses</span>
        <span className="ml-auto opacity-50 group-data-[collapsible=icon]:hidden">
          {open ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </span>
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {isLoading ? (
            <SidebarMenuSubItem>
              <span className="px-2 py-1.5 text-sm text-muted-foreground">
                Cargando…
              </span>
            </SidebarMenuSubItem>
          ) : (
            <>
              {months?.map((m) => (
                <SidebarMenuSubItem key={m.id}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={m.id === currentMonthId}
                  >
                    <Link href={`/mes/${m.id}`}>
                      {m.label}
                      {m.is_closed && (
                        <span className="ml-1 text-muted-foreground text-xs">
                          (cerrado)
                        </span>
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <button
                    type="button"
                    onClick={handleCreateMonth}
                    disabled={createMonth.isPending}
                    className="w-full text-left"
                  >
                    <CalendarPlus className="size-4" />
                    {createMonth.isPending ? "Creando…" : "Agregar nuevo mes"}
                  </button>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </>
          )}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
