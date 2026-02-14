"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { TransactionType } from "@/lib/db/types";
import type { Account } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCreateTransaction } from "@/hooks/use-transactions";

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "internal_transfer", label: "Transfer" },
  { value: "adjustment", label: "Adjustment" },
];

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAmount(s: string): number {
  const n = Number(s.trim().replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

type Props = {
  monthId: string;
  accounts: Account[];
  nextRowOrder: number;
};

export function AddTransactionSheet({
  monthId,
  accounts,
  nextRowOrder,
}: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => toYMD(new Date()));
  const [type, setType] = useState<TransactionType>("income");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const createTransaction = useCreateTransaction(monthId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accounts.length) return;

    let amounts: { account_id: string; amount: number }[] = [];

    if (type === "income") {
      const acc = accountId || accounts[0]?.id;
      const value = parseAmount(amount);
      if (acc && value > 0) amounts = [{ account_id: acc, amount: value }];
    } else if (type === "expense") {
      const acc = accountId || accounts[0]?.id;
      const value = parseAmount(amount);
      if (acc && value > 0) amounts = [{ account_id: acc, amount: -value }];
    } else if (type === "internal_transfer") {
      const from = transferFromId || accounts[0]?.id;
      const to = transferToId || accounts[1]?.id;
      const value = parseAmount(transferAmount);
      if (from && to && from !== to && value > 0) {
        amounts = [
          { account_id: from, amount: -value },
          { account_id: to, amount: value },
        ];
      }
    } else if (type === "adjustment") {
      const acc = accountId || accounts[0]?.id;
      const value = parseAmount(amount);
      if (acc && value !== 0) amounts = [{ account_id: acc, amount: value }];
    }

    if (amounts.length === 0) return;

    try {
      await createTransaction.mutateAsync({
        month_id: monthId,
        date,
        type,
        description: description.trim() || "(no description)",
        row_order: nextRowOrder,
        amounts,
      });
      setOpen(false);
      setDescription("");
      setAmount("");
      setTransferAmount("");
    } catch {
      // Error surfaced by mutation
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add transaction
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add transaction</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fuel, Payment"
            />
          </div>

          {(type === "income" || type === "expense" || type === "adjustment") && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Amount {type === "adjustment" && "(+ or -)"}
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </>
          )}

          {type === "internal_transfer" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">From account</label>
                <select
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">To account</label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Amount</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTransaction.isPending}
              className="flex-1"
            >
              {createTransaction.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
          {createTransaction.isError && (
            <p className="text-sm text-destructive">
              {createTransaction.error.message}
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
