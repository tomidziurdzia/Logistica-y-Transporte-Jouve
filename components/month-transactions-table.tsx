"use client";

import { useCallback, useMemo, useState } from "react";
import { MoreVertical, Plus, Save, Trash2, X } from "lucide-react";
import type {
  Account,
  Category,
  TransactionType,
  TransactionWithAmounts,
} from "@/lib/db/types";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/hooks/use-transactions";

const TYPE_LABEL: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  internal_transfer: "Transfer",
  adjustment: "Adjustment",
};

const TYPE_BADGE_VARIANT: Record<
  string,
  "income" | "expense" | "transfer" | "adjustment"
> = {
  income: "income",
  expense: "expense",
  internal_transfer: "transfer",
  adjustment: "adjustment",
};

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "Z");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function getAmountForRow(
  row: TransactionWithAmounts | DraftRow,
  accountId: string
): number {
  if ("transaction_amounts" in row && row.transaction_amounts) {
    const line = row.transaction_amounts.find(
      (a) => a.account_id === accountId
    );
    return line?.amount ?? 0;
  }
  if ("amounts" in row && row.amounts) {
    return row.amounts[accountId] ?? 0;
  }
  return 0;
}

function getRowTotal(
  row: TransactionWithAmounts | DraftRow,
  accountIds: string[]
): number {
  return accountIds.reduce((s, accId) => s + getAmountForRow(row, accId), 0);
}

interface DraftRow {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  category_id: string | null;
  amounts: Record<string, number>;
}

type RowEdit = Partial<{
  date: string;
  type: TransactionType;
  description: string;
  category_id: string | null;
  amounts: Record<string, number>;
}>;

type TableRow = { id: string; isDraft: boolean } & (
  | TransactionWithAmounts
  | DraftRow
);

function mergeRow(
  row: TransactionWithAmounts | DraftRow,
  edit: RowEdit | undefined
): TransactionWithAmounts | DraftRow {
  if (!edit || Object.keys(edit).length === 0) return row;
  if ("transaction_amounts" in row) {
    const tx = row as TransactionWithAmounts;
    const amounts =
      edit.amounts !== undefined
        ? Object.entries(edit.amounts).map(([account_id, amount]) => ({
            account_id,
            amount,
          }))
        : tx.transaction_amounts;
    return {
      ...tx,
      ...(edit.date !== undefined && { date: edit.date }),
      ...(edit.type !== undefined && { type: edit.type }),
      ...(edit.description !== undefined && { description: edit.description }),
      ...(edit.category_id !== undefined && { category_id: edit.category_id }),
      ...(edit.amounts !== undefined && {
        transaction_amounts: amounts.map((a) => ({
          id: "",
          transaction_id: tx.id,
          account_id: a.account_id,
          amount: a.amount,
          created_at: "",
        })),
      }),
    };
  }
  return { ...row, ...edit } as DraftRow;
}

interface MonthTransactionsTableProps {
  monthId: string;
  accounts: Account[];
  categories: Category[];
  transactions: TransactionWithAmounts[];
  nextRowOrder: number;
}

export function MonthTransactionsTable({
  monthId,
  accounts,
  categories,
  transactions,
  nextRowOrder,
}: MonthTransactionsTableProps) {
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Allow typing "-" for negative amounts; key = `${rowId}-${accId}`
  const [pendingAmountInput, setPendingAmountInput] = useState<
    Record<string, string>
  >({});

  const createTx = useCreateTransaction(monthId);
  const updateTx = useUpdateTransaction(monthId);
  const deleteTx = useDeleteTransaction(monthId);

  const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts]);

  const allRows: TableRow[] = useMemo(() => {
    const existing: TableRow[] = transactions.map((t) => ({
      ...t,
      id: t.id,
      isDraft: false,
    }));
    const drafts: TableRow[] = draftRows.map((d) => ({ ...d, isDraft: true }));
    const combined = [...drafts, ...existing];
    return combined.sort((a, b) => {
      // Drafts always first (new rows at top until saved)
      if (a.isDraft && !b.isDraft) return -1;
      if (!a.isDraft && b.isDraft) return 1;
      const dateA = "date" in a ? a.date : "";
      const dateB = "date" in b ? b.date : "";
      const cmp = (dateA || "").localeCompare(dateB || "");
      if (cmp !== 0) return cmp;
      const orderA = "row_order" in a ? (a as TransactionWithAmounts).row_order : 0;
      const orderB = "row_order" in b ? (b as TransactionWithAmounts).row_order : 0;
      return orderA - orderB;
    });
  }, [transactions, draftRows]);

  const getDisplayRow = useCallback(
    (row: TableRow) => mergeRow(row, edits[row.id]),
    [edits]
  );

  const setEdit = useCallback((id: string, update: RowEdit) => {
    setEdits((prev) => {
      const next = { ...prev[id], ...update };
      const keys = Object.keys(next) as (keyof RowEdit)[];
      const hasChange = keys.some((k) => next[k] !== undefined);
      if (!hasChange) {
        return Object.fromEntries(
          Object.entries(prev).filter(([k]) => k !== id)
        ) as Record<string, RowEdit>;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  const addRow = useCallback(() => {
    setDraftRows((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}-${prev.length}`,
        date: toYMD(new Date()),
        type: "income",
        description: "",
        category_id: null,
        amounts: {},
      },
    ]);
  }, []);

  const discardDraftRow = useCallback((draftId: string) => {
    setDraftRows((prev) => prev.filter((r) => r.id !== draftId));
    setEdits((prev) => {
      const next = { ...prev };
      delete next[draftId];
      return next;
    });
  }, []);

  const saveDraftRow = useCallback(
    async (d: DraftRow) => {
      setValidationError(null);
      // Use display row (draft + edits) so we validate what the user actually sees
      const tableRow: TableRow = { ...d, isDraft: true };
      const display = getDisplayRow(tableRow);
      const displayDate = "date" in display ? display.date : "";
      const displayDesc = "description" in display ? display.description : "";
      const displayType = "type" in display ? display.type : d.type;
      const displayCategoryId =
        "category_id" in display ? display.category_id : d.category_id;
      const accountsWithAmount = accountIds.filter(
        (accId) => getAmountForRow(display, accId) !== 0
      ).length;
      const hasAmount = accountsWithAmount > 0;
      if (!String(displayDate).trim()) {
        setValidationError("Date is required.");
        return;
      }
      if (!String(displayDesc).trim()) {
        setValidationError("Description is required.");
        return;
      }
      if (!hasAmount) {
        setValidationError("At least one amount is required.");
        return;
      }
      if (displayType === "internal_transfer" && accountsWithAmount < 2) {
        setValidationError("Internal transfer requires at least two accounts.");
        return;
      }
      if (displayType === "internal_transfer") {
        const sum = accountIds.reduce(
          (s, accId) => s + getAmountForRow(display, accId),
          0
        );
        if (Math.abs(sum) > 1e-6) {
          setValidationError(
            "Internal transfer must balance: sum of amounts must be 0."
          );
          return;
        }
      }
      if (!displayCategoryId) {
        setValidationError("Category is required.");
        return;
      }
      try {
        const amounts = accountIds
          .filter((accId) => getAmountForRow(display, accId) !== 0)
          .map((account_id) => ({
            account_id,
            amount: getAmountForRow(display, account_id),
          }));
        const draftIndex = draftRows.findIndex((r) => r.id === d.id);
        await createTx.mutateAsync({
          month_id: monthId,
          date: String(displayDate).trim(),
          type: displayType,
          description: String(displayDesc).trim(),
          category_id: displayCategoryId,
          row_order: nextRowOrder + draftIndex,
          amounts,
        });
        setDraftRows((prev) => prev.filter((r) => r.id !== d.id));
      } catch {
        // Error from mutation
      }
    },
    [accountIds, monthId, nextRowOrder, createTx, draftRows, getDisplayRow]
  );

  const saveEditedRow = useCallback(
    async (rowId: string) => {
      const edit = edits[rowId];
      if (!edit || Object.keys(edit).length === 0) {
        setEditingRowId(null);
        return;
      }
      const row = allRows.find((r) => r.id === rowId && !r.isDraft);
      if (!row) return;
      const display = getDisplayRow(row);
      setValidationError(null);
      const accountsWithAmount = accountIds.filter(
        (accId) => getAmountForRow(display, accId) !== 0
      ).length;
      const hasAmount = accountsWithAmount > 0;
      if (!display.date?.trim()) {
        setValidationError("Date is required.");
        return;
      }
      if (!display.description?.trim()) {
        setValidationError("Description is required.");
        return;
      }
      if (!hasAmount) {
        setValidationError("At least one amount is required.");
        return;
      }
      if (
        display.type === "internal_transfer" &&
        accountsWithAmount < 2
      ) {
        setValidationError("Internal transfer requires at least two accounts.");
        return;
      }
      if (display.type === "internal_transfer") {
        const sum = accountIds.reduce(
          (s, accId) => s + getAmountForRow(display, accId),
          0
        );
        if (Math.abs(sum) > 1e-6) {
          setValidationError(
            "Internal transfer must balance: sum of amounts must be 0."
          );
          return;
        }
      }
      if (!display.category_id) {
        setValidationError("Category is required.");
        return;
      }
      const orig = transactions.find((t) => t.id === rowId);
      if (!orig) return;
      try {
        const payload: Parameters<typeof updateTx.mutateAsync>[0] = { id: rowId };
        if (edit.date !== undefined) payload.date = edit.date;
        if (edit.type !== undefined) payload.type = edit.type;
        if (edit.description !== undefined)
          payload.description = edit.description;
        if (edit.category_id !== undefined)
          payload.category_id = edit.category_id;
        if (edit.amounts !== undefined) {
          const fullAmounts = {
            ...Object.fromEntries(
              orig.transaction_amounts.map((a) => [a.account_id, a.amount])
            ),
            ...edit.amounts,
          };
          payload.amounts = Object.entries(fullAmounts)
            .filter(([, amount]) => amount !== 0)
            .map(([account_id, amount]) => ({ account_id, amount: amount! }));
        }
        await updateTx.mutateAsync(payload);
        setEdits((prev) => {
          const next = { ...prev };
          delete next[rowId];
          return next;
        });
        setEditingRowId(null);
      } catch {
        // Error from mutation
      }
    },
    [
      edits,
      allRows,
      transactions,
      accountIds,
      getDisplayRow,
      updateTx,
    ]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    try {
      await deleteTx.mutateAsync(deleteTargetId);
      setDeleteTargetId(null);
    } catch {
      // Error from mutation
    }
  }, [deleteTargetId, deleteTx]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          <Plus className="size-4" />
          Add row
        </Button>
        {(createTx.isError || updateTx.isError) && (
          <p className="text-sm text-destructive">
            {createTx.error?.message ?? updateTx.error?.message}
          </p>
        )}
        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
      </div>
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border p-4 shadow-lg max-w-sm w-full mx-4">
            <p className="text-sm font-medium mb-4">
              Are you sure you want to delete this transaction?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={deleteTx.isPending}
              >
                {deleteTx.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div
        className="min-h-[200px] flex-1 overflow-auto rounded-md border"
        style={{ maxHeight: "calc(100svh - 24rem)" }}
      >
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-muted sticky top-0 z-10">
              <th className="sticky top-0 z-10 bg-muted px-3 py-2 text-left font-medium">
                Date
              </th>
              <th className="sticky top-0 z-10 bg-muted px-3 py-2 text-left font-medium">
                Description
              </th>
              <th className="sticky top-0 z-10 bg-muted px-3 py-2 text-left font-medium">
                Tipo
              </th>
              {(accounts ?? []).map((acc) => (
                <th
                  key={acc.id}
                  className="sticky top-0 z-10 bg-muted px-3 py-2 text-right font-medium tabular-nums"
                >
                  {acc.name}
                </th>
              ))}
              <th className="sticky top-0 z-10 bg-muted px-3 py-2 text-right font-medium tabular-nums">
                Total
              </th>
              <th className="sticky top-0 z-10 bg-muted px-3 py-2 text-left font-medium">
                Category
              </th>
              <th className="sticky top-0 z-10 w-[4.5rem] bg-muted px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {allRows.map((row) => {
              const display = getDisplayRow(row);
              const total = getRowTotal(display, accountIds);
              const isDraft = row.isDraft;
              const isEditing = isDraft || editingRowId === row.id;
              const selectClass =
                "border-input h-8 w-full rounded-md border bg-transparent px-2 py-1 text-sm";

              return (
                <tr
                  key={row.id}
                  className="border-b last:border-b-0 hover:bg-muted/30"
                >
                  {isEditing ? (
                    <>
                      <td className="px-3 py-1.5">
                        <Input
                          type="date"
                          value={display.date}
                          onChange={(e) =>
                            isDraft
                              ? setDraftRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, date: e.target.value }
                                      : r
                                  )
                                )
                              : setEdit(row.id, { date: e.target.value })
                          }
                          className="h-8 text-sm"
                          required
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          value={display.description}
                          onChange={(e) =>
                            isDraft
                              ? setDraftRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, description: e.target.value }
                                      : r
                                  )
                                )
                              : setEdit(row.id, { description: e.target.value })
                          }
                          placeholder="Description"
                          className="h-8 text-sm max-w-[180px]"
                          required
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <select
                          value={display.type}
                          onChange={(e) =>
                            isDraft
                              ? setDraftRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? {
                                          ...r,
                                          type: e.target
                                            .value as TransactionType,
                                        }
                                      : r
                                  )
                                )
                              : setEdit(row.id, {
                                  type: e.target.value as TransactionType,
                                })
                          }
                          className={selectClass}
                        >
                          {(
                            Object.entries(TYPE_LABEL) as [
                              TransactionType,
                              string
                            ][]
                          ).map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      {accountIds.map((accId) => {
                        const amountKey = `${row.id}-${accId}`;
                        const amount = getAmountForRow(display, accId);
                        const inputValue =
                          pendingAmountInput[amountKey] !== undefined
                            ? pendingAmountInput[amountKey]
                            : amount === 0
                              ? ""
                              : String(amount);
                        return (
                          <td
                            key={accId}
                            className="px-3 py-1.5 text-right"
                          >
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={inputValue}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const trimmed = raw.replace(",", ".");
                                const num = parseFloat(trimmed);
                                setPendingAmountInput((prev) => ({
                                  ...prev,
                                  [amountKey]: raw,
                                }));
                                const valueToStore =
                                  raw === "" || raw === "-"
                                    ? 0
                                    : !Number.isNaN(num)
                                      ? num
                                      : amount;
                                if (isDraft) {
                                  setDraftRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id
                                        ? {
                                            ...r,
                                            amounts: {
                                              ...r.amounts,
                                              [accId]: valueToStore,
                                            },
                                          }
                                        : r
                                    )
                                  );
                                } else {
                                  const currentAmounts = accountIds.reduce(
                                    (acc, aid) => ({
                                      ...acc,
                                      [aid]: getAmountForRow(display, aid),
                                    }),
                                    {} as Record<string, number>
                                  );
                                  setEdit(row.id, {
                                    amounts: {
                                      ...currentAmounts,
                                      [accId]: valueToStore,
                                    },
                                  });
                                }
                              }}
                              onBlur={() => {
                                setPendingAmountInput((prev) => {
                                  const next = { ...prev };
                                  delete next[amountKey];
                                  return next;
                                });
                              }}
                              className="h-8 w-24 text-right text-sm tabular-nums"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-3 py-1.5">
                        <select
                          value={display.category_id ?? ""}
                          onChange={(e) =>
                            isDraft
                              ? setDraftRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? {
                                          ...r,
                                          category_id: e.target.value || null,
                                        }
                                      : r
                                  )
                                )
                              : setEdit(row.id, {
                                  category_id: e.target.value || null,
                                })
                          }
                          className={selectClass}
                          required
                        >
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="w-[4.5rem] px-1 py-1 align-top">
                        {isDraft ? (
                          <div className="flex items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="h-7 w-7"
                              onClick={() => saveDraftRow(row as DraftRow)}
                              disabled={createTx.isPending}
                              title="Save row"
                            >
                              <Save className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => discardDraftRow(row.id)}
                              disabled={createTx.isPending}
                              title="Discard row"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ) : editingRowId === row.id ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="h-7 w-7"
                            onClick={() => saveEditedRow(row.id)}
                            disabled={updateTx.isPending}
                            title="Save row"
                          >
                            <Save className="size-4" />
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="h-7 w-7"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  editingRowId === row.id
                                    ? setEditingRowId(null)
                                    : setEditingRowId(row.id)
                                }
                              >
                                {editingRowId === row.id
                                  ? "Cancel edit"
                                  : "Edit"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteTargetId(row.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground text-sm">
                        {formatDate(display.date)}
                      </td>
                      <td className="px-3 py-1.5 text-sm max-w-[180px] truncate">
                        {display.description || "—"}
                      </td>
                      <td className="px-3 py-1.5">
                        <Badge
                          variant={
                            TYPE_BADGE_VARIANT[display.type] ?? "secondary"
                          }
                        >
                          {TYPE_LABEL[display.type] ?? display.type}
                        </Badge>
                      </td>
                      {accountIds.map((accId) => {
                        const amount = getAmountForRow(display, accId);
                        return (
                          <td
                            key={accId}
                            className="px-3 py-1.5 text-right tabular-nums text-sm"
                          >
                            {amount !== 0 ? formatCurrency(amount) : "—"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5 text-right font-medium tabular-nums text-sm">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-3 py-1.5 text-sm text-muted-foreground">
                        {categories.find((c) => c.id === display.category_id)
                          ?.name ?? "—"}
                      </td>
                      <td className="w-[4.5rem] px-1 py-1 align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="h-7 w-7"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                editingRowId === row.id
                                  ? setEditingRowId(null)
                                  : setEditingRowId(row.id)
                              }
                            >
                              {editingRowId === row.id ? "Cancel edit" : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTargetId(row.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {allRows.length === 0 && (
          <p className="border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No transactions. Click &quot;Add row&quot; to add one.
          </p>
        )}
      </div>
    </div>
  );
}
