"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  usePreviousMonthBalances,
  useCreateMonthWithBalances,
} from "@/hooks/use-months";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface NewMonthModalProps {
  year: number;
  month: number;
  onClose: () => void;
  onCreated: (monthId: string) => void;
}

export function NewMonthModal({ year, month, onClose, onCreated }: NewMonthModalProps) {
  const label = `${MONTH_NAMES[month - 1]} ${String(year).slice(-2)}`;
  const { data: balances, isLoading } = usePreviousMonthBalances(year, month, true);
  const createMonthMutation = useCreateMonthWithBalances();

  const [editing, setEditing] = useState(false);
  const [editedAmounts, setEditedAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (balances) {
      const map: Record<string, number> = {};
      for (const b of balances) {
        map[b.account_id] = b.balance;
      }
      setEditedAmounts(map);
    }
  }, [balances]);

  const total = useMemo(() => {
    return Object.values(editedAmounts).reduce((sum, val) => sum + val, 0);
  }, [editedAmounts]);

  const handleAmountChange = useCallback((accountId: string, value: string) => {
    const num = parseFloat(value);
    setEditedAmounts((prev) => ({
      ...prev,
      [accountId]: isNaN(num) ? 0 : num,
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!balances) return;
    const balancesList = balances.map((b) => ({
      account_id: b.account_id,
      amount: editedAmounts[b.account_id] ?? 0,
    }));
    createMonthMutation.mutate(
      { year, month, balances: balancesList },
      {
        onSuccess: (newMonth) => {
          onCreated(newMonth.id);
        },
      },
    );
  }, [balances, editedAmounts, year, month, createMonthMutation, onCreated]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border p-6 shadow-lg max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Nuevo mes — {label}</h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Cargando saldos anteriores…</p>
        ) : balances && balances.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No hay cuentas activas.</p>
        ) : (
          <div className="overflow-y-auto flex-1 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Saldos del mes anterior</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing((e) => !e)}
              >
                <Pencil className="size-3.5 mr-1" />
                {editing ? "Listo" : "Editar"}
              </Button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1.5 font-medium">Cuenta</th>
                  <th className="py-1.5 font-medium text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {balances?.map((b) => (
                  <tr key={b.account_id} className="border-b last:border-0">
                    <td className="py-1.5">{b.account_name}</td>
                    <td className="py-1.5 text-right">
                      {editing ? (
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 w-full text-right text-sm [&::-webkit-inner-spin-button]:appearance-none"
                          value={editedAmounts[b.account_id] ?? 0}
                          onChange={(e) =>
                            handleAmountChange(b.account_id, e.target.value)
                          }
                        />
                      ) : (
                        <span className={editedAmounts[b.account_id] < 0 ? "text-destructive" : ""}>
                          {formatCurrency(editedAmounts[b.account_id] ?? 0)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="py-2">Total</td>
                  <td className={`py-2 text-right ${total < 0 ? "text-destructive" : ""}`}>
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading || createMonthMutation.isPending || !balances}
          >
            {createMonthMutation.isPending ? "Creando…" : "Confirmar"}
          </Button>
        </div>

        {createMonthMutation.isError && (
          <p className="text-sm text-destructive mt-2">
            {createMonthMutation.error.message}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
