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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SidebarMonthsDropdown() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const collapsed = mounted && state === "collapsed";
  const [open, setOpen] = useState(false);
  const { data: months, isLoading } = useMonths();
  const createMonth = useCreateMonth();

  useEffect(() => setMounted(true), []);

  const monthIdMatch = pathname.match(/^\/mes\/([a-f0-9-]+)$/i);
  const currentMonthId = monthIdMatch?.[1] ?? null;

  // Open when on a month route
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

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="cursor-pointer">
              <Calendar className="size-4" />
              <span className="truncate">Months</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuLabel>Months</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoading ? (
              <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
            ) : (
              <>
                {months?.map((m) => (
                  <DropdownMenuItem key={m.id} asChild>
                    <Link href={`/mes/${m.id}`}>
                      {m.label}
                      {m.is_closed && (
                        <span className="ml-1 text-muted-foreground text-xs">
                          (closed)
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleCreateMonth}
                  disabled={createMonth.isPending}
                >
                  <CalendarPlus className="size-4" />
                  {createMonth.isPending ? "Creating…" : "Add new month"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer"
      >
        <Calendar className="size-4" />
        <span className="truncate">Months</span>
        <span className="ml-auto opacity-50">
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
                Loading…
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
                          (closed)
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
                    {createMonth.isPending ? "Creating…" : "Add new month"}
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
