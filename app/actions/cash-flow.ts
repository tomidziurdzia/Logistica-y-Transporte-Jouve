"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Month,
  CashFlowAnnualData,
  CashFlowMonthColumn,
  CashFlowCategoryRow,
  CashFlowBalanceRow,
  CashFlowMonthDetail,
  CashFlowCategoryDetail,
  CashFlowSubcategoryRow,
  IncomeStatementData,
  IncomeStatementRow,
  TransactionWithAmounts,
  OpeningBalance,
} from "@/lib/db/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyMonthColumns(months: Month[]): CashFlowMonthColumn[] {
  return months.map((m) => ({ month_id: m.id, label: m.label, amount: 0 }));
}

/** Get all months in a fiscal range, ordered chronologically. */
async function getMonthsInRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Promise<Month[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("months")
    .select("*")
    .order("year", { ascending: true })
    .order("month", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as Month[]).filter((m) => {
    const val = m.year * 100 + m.month;
    return val >= startYear * 100 + startMonth && val <= endYear * 100 + endMonth;
  });
}

/** Get all transactions for a list of months, with their amounts. */
async function getTransactionsForMonths(
  monthIds: string[]
): Promise<TransactionWithAmounts[]> {
  if (monthIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, transaction_amounts (*)")
    .in("month_id", monthIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as TransactionWithAmounts[];
}

/** Get opening balances for a list of months. */
async function getOpeningBalancesForMonths(
  monthIds: string[]
): Promise<OpeningBalance[]> {
  if (monthIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opening_balances")
    .select("*")
    .in("month_id", monthIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as OpeningBalance[];
}

// ---------------------------------------------------------------------------
// 1. Annual Cash Flow
// ---------------------------------------------------------------------------

export async function getCashFlowAnnual(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): Promise<CashFlowAnnualData> {
  const supabase = await createClient();

  // Fetch months, accounts, categories, income_categories in parallel
  const [months, accountsRes, categoriesRes, incomeCatsRes] = await Promise.all([
    getMonthsInRange(startYear, startMonth, endYear, endMonth),
    supabase.from("accounts").select("*").eq("is_active", true).order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("income_categories").select("*").order("display_order"),
  ]);

  if (accountsRes.error) throw new Error(accountsRes.error.message);
  if (categoriesRes.error) throw new Error(categoriesRes.error.message);
  if (incomeCatsRes.error) throw new Error(incomeCatsRes.error.message);

  const accounts = accountsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const incomeCategories = incomeCatsRes.data ?? [];

  const monthIds = months.map((m) => m.id);

  // Fetch transactions and opening balances
  const [transactions, openingBalances] = await Promise.all([
    getTransactionsForMonths(monthIds),
    getOpeningBalancesForMonths(monthIds),
  ]);

  // --- Opening balances per account per month ---
  const opening_balances: CashFlowBalanceRow[] = accounts.map((acc) => {
    const cols = months.map((m) => {
      const ob = openingBalances.find(
        (o) => o.month_id === m.id && o.account_id === acc.id
      );
      return { month_id: m.id, label: m.label, amount: ob?.amount ?? 0 };
    });
    return {
      account_id: acc.id,
      account_name: acc.name,
      months: cols,
      total: cols.reduce((s, c) => s + c.amount, 0),
    };
  });

  const opening_total: CashFlowMonthColumn[] = months.map((m) => ({
    month_id: m.id,
    label: m.label,
    amount: opening_balances.reduce(
      (s, row) => s + (row.months.find((c) => c.month_id === m.id)?.amount ?? 0),
      0
    ),
  }));

  // --- Income rows (by income_category) ---
  const incomeTransactions = transactions.filter((t) => t.type === "income");

  const income_rows: CashFlowCategoryRow[] = incomeCategories.map((ic) => {
    const cols = months.map((m) => {
      const monthTxs = incomeTransactions.filter(
        (t) => t.month_id === m.id && t.income_category_id === ic.id
      );
      const amount = monthTxs.reduce(
        (s, t) => s + t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0),
        0
      );
      return { month_id: m.id, label: m.label, amount };
    });
    return {
      category_id: ic.id,
      category_name: ic.name,
      months: cols,
      total: cols.reduce((s, c) => s + c.amount, 0),
    };
  });

  // Unclassified income (no income_category_id)
  const unclassifiedIncomeCols = months.map((m) => {
    const monthTxs = incomeTransactions.filter(
      (t) => t.month_id === m.id && !t.income_category_id
    );
    const amount = monthTxs.reduce(
      (s, t) => s + t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0),
      0
    );
    return { month_id: m.id, label: m.label, amount };
  });
  const unclassifiedTotal = unclassifiedIncomeCols.reduce((s, c) => s + c.amount, 0);
  if (unclassifiedTotal !== 0) {
    income_rows.push({
      category_id: null,
      category_name: "Sin clasificar",
      months: unclassifiedIncomeCols,
      total: unclassifiedTotal,
    });
  }

  const income_total: CashFlowMonthColumn[] = months.map((m) => ({
    month_id: m.id,
    label: m.label,
    amount: income_rows.reduce(
      (s, row) => s + (row.months.find((c) => c.month_id === m.id)?.amount ?? 0),
      0
    ),
  }));

  // --- Expense rows (by category) ---
  const expenseTransactions = transactions.filter((t) => t.type === "expense");

  // Define the category order from the Excel
  const CATEGORY_ORDER = [
    "Combustibles", "Compra Rodados", "Repuestos y Reparaciones", "Peajes",
    "Instalaciones", "Alquileres", "Impuestos", "Sueldos", "Sindicato",
    "Federacion", "Directores", "Gastos bancarios", "Prestamos", "Gastos Varios",
    "RR", "Compra USD",
  ];

  const sortedCategories = [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.name);
    const bi = CATEGORY_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const expense_rows: CashFlowCategoryRow[] = sortedCategories.map((cat) => {
    const cols = months.map((m) => {
      const monthTxs = expenseTransactions.filter(
        (t) => t.month_id === m.id && t.category_id === cat.id
      );
      const amount = monthTxs.reduce(
        (s, t) =>
          s + Math.abs(t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0)),
        0
      );
      return { month_id: m.id, label: m.label, amount };
    });
    return {
      category_id: cat.id,
      category_name: cat.name,
      months: cols,
      total: cols.reduce((s, c) => s + c.amount, 0),
    };
  });

  const expense_total: CashFlowMonthColumn[] = months.map((m) => ({
    month_id: m.id,
    label: m.label,
    amount: expense_rows.reduce(
      (s, row) => s + (row.months.find((c) => c.month_id === m.id)?.amount ?? 0),
      0
    ),
  }));

  // --- Result = income - expenses ---
  const result: CashFlowMonthColumn[] = months.map((m) => {
    const inc = income_total.find((c) => c.month_id === m.id)?.amount ?? 0;
    const exp = expense_total.find((c) => c.month_id === m.id)?.amount ?? 0;
    return { month_id: m.id, label: m.label, amount: inc - exp };
  });

  // --- Closing balances = opening + all transaction net ---
  const closing_balances: CashFlowBalanceRow[] = accounts.map((acc) => {
    const cols = months.map((m) => {
      const ob = openingBalances.find(
        (o) => o.month_id === m.id && o.account_id === acc.id
      );
      const monthTxs = transactions.filter((t) => t.month_id === m.id);
      const txNet = monthTxs.reduce((s, t) => {
        const accAmount = t.transaction_amounts.find(
          (a) => a.account_id === acc.id
        );
        return s + (accAmount?.amount ?? 0);
      }, 0);
      return { month_id: m.id, label: m.label, amount: (ob?.amount ?? 0) + txNet };
    });
    return {
      account_id: acc.id,
      account_name: acc.name,
      months: cols,
      total: cols.reduce((s, c) => s + c.amount, 0),
    };
  });

  const closing_total: CashFlowMonthColumn[] = months.map((m) => ({
    month_id: m.id,
    label: m.label,
    amount: closing_balances.reduce(
      (s, row) => s + (row.months.find((c) => c.month_id === m.id)?.amount ?? 0),
      0
    ),
  }));

  return {
    months,
    opening_balances,
    opening_total,
    income_rows,
    income_total,
    expense_rows,
    expense_total,
    result,
    closing_balances,
    closing_total,
  };
}

// ---------------------------------------------------------------------------
// 2. Monthly Expense Detail (with subcategories)
// ---------------------------------------------------------------------------

export async function getCashFlowMonthDetail(
  monthId: string
): Promise<CashFlowMonthDetail | null> {
  const supabase = await createClient();

  const [monthRes, categoriesRes, subcategoriesRes, txRes] = await Promise.all([
    supabase.from("months").select("*").eq("id", monthId).single(),
    supabase.from("categories").select("*").order("name"),
    supabase.from("subcategories").select("*").order("display_order"),
    supabase
      .from("transactions")
      .select("*, transaction_amounts (*)")
      .eq("month_id", monthId)
      .eq("type", "expense"),
  ]);

  if (monthRes.error) throw new Error(monthRes.error.message);
  if (!monthRes.data) return null;
  if (categoriesRes.error) throw new Error(categoriesRes.error.message);
  if (subcategoriesRes.error) throw new Error(subcategoriesRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);

  const month = monthRes.data as Month;
  const allCategories = categoriesRes.data ?? [];
  const allSubcategories = subcategoriesRes.data ?? [];
  const expenses = (txRes.data ?? []) as TransactionWithAmounts[];

  const CATEGORY_ORDER = [
    "Combustibles", "Compra Rodados", "Repuestos y Reparaciones", "Peajes",
    "Instalaciones", "Alquileres", "Impuestos", "Sueldos", "Sindicato",
    "Federacion", "Directores", "Gastos bancarios", "Prestamos", "Gastos Varios",
    "RR", "Compra USD",
  ];

  const sortedCategories = [...allCategories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.name);
    const bi = CATEGORY_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  let grandBankCash = 0;
  let grandCreditCard = 0;

  const categories: CashFlowCategoryDetail[] = sortedCategories
    .map((cat) => {
      const catTxs = expenses.filter((t) => t.category_id === cat.id);
      if (catTxs.length === 0) return null;

      const catSubs = allSubcategories.filter((s) => s.category_id === cat.id);

      const subcategories: CashFlowSubcategoryRow[] = catSubs.map((sub) => {
        const subTxs = catTxs.filter((t) => t.subcategory_id === sub.id);
        const bankCash = subTxs
          .filter((t) => t.payment_method === "bank_cash")
          .reduce(
            (s, t) =>
              s + Math.abs(t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0)),
            0
          );
        const creditCard = subTxs
          .filter((t) => t.payment_method === "credit_card")
          .reduce(
            (s, t) =>
              s + Math.abs(t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0)),
            0
          );
        return {
          subcategory_id: sub.id,
          subcategory_name: sub.name,
          bank_cash: bankCash,
          credit_card: creditCard,
          total: bankCash + creditCard,
        };
      });

      // Unclassified (no subcategory)
      const unclassifiedTxs = catTxs.filter(
        (t) => !t.subcategory_id || !catSubs.some((s) => s.id === t.subcategory_id)
      );
      if (unclassifiedTxs.length > 0) {
        const bankCash = unclassifiedTxs
          .filter((t) => t.payment_method === "bank_cash")
          .reduce(
            (s, t) =>
              s + Math.abs(t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0)),
            0
          );
        const creditCard = unclassifiedTxs
          .filter((t) => t.payment_method === "credit_card")
          .reduce(
            (s, t) =>
              s + Math.abs(t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0)),
            0
          );
        if (bankCash !== 0 || creditCard !== 0) {
          subcategories.push({
            subcategory_id: null,
            subcategory_name: "Sin clasificar",
            bank_cash: bankCash,
            credit_card: creditCard,
            total: bankCash + creditCard,
          });
        }
      }

      const bankCashTotal = subcategories.reduce((s, r) => s + r.bank_cash, 0);
      const creditCardTotal = subcategories.reduce((s, r) => s + r.credit_card, 0);

      grandBankCash += bankCashTotal;
      grandCreditCard += creditCardTotal;

      return {
        category_id: cat.id,
        category_name: cat.name,
        subcategories,
        bank_cash_total: bankCashTotal,
        credit_card_total: creditCardTotal,
        total: bankCashTotal + creditCardTotal,
      };
    })
    .filter((c): c is CashFlowCategoryDetail => c !== null);

  return {
    month,
    categories,
    grand_bank_cash: grandBankCash,
    grand_credit_card: grandCreditCard,
    grand_total: grandBankCash + grandCreditCard,
  };
}

// ---------------------------------------------------------------------------
// 3. Income Statement (P&L) — supports accrual vs cash basis
// ---------------------------------------------------------------------------

export async function getIncomeStatement(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  accrualBasis: boolean = false,
  excludeNonBusiness: boolean = false
): Promise<IncomeStatementData> {
  const supabase = await createClient();

  const [months, incomeCatsRes, categoriesRes] = await Promise.all([
    getMonthsInRange(startYear, startMonth, endYear, endMonth),
    supabase.from("income_categories").select("*").order("display_order"),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (incomeCatsRes.error) throw new Error(incomeCatsRes.error.message);
  if (categoriesRes.error) throw new Error(categoriesRes.error.message);

  const incomeCategories = incomeCatsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const monthIds = months.map((m) => m.id);

  const transactions = await getTransactionsForMonths(monthIds);

  // For accrual basis, use accrual_month_id if set, otherwise month_id
  function getEffectiveMonthId(t: TransactionWithAmounts): string {
    return accrualBasis && t.accrual_month_id ? t.accrual_month_id : t.month_id;
  }

  // Filter non-business if needed
  const filtered = excludeNonBusiness
    ? transactions.filter((t) => t.is_business_expense)
    : transactions;

  // Income rows
  const incomeTransactions = filtered.filter((t) => t.type === "income");
  const income_rows: IncomeStatementRow[] = incomeCategories.map((ic) => {
    const cols = months.map((m) => {
      const monthTxs = incomeTransactions.filter(
        (t) => getEffectiveMonthId(t) === m.id && t.income_category_id === ic.id
      );
      const amount = monthTxs.reduce(
        (s, t) => s + t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0),
        0
      );
      return { month_id: m.id, label: m.label, amount };
    });
    return { label: ic.name, months: cols, total: cols.reduce((s, c) => s + c.amount, 0) };
  });

  const income_total: IncomeStatementRow = {
    label: "TOTAL INGRESOS",
    months: months.map((m) => ({
      month_id: m.id,
      label: m.label,
      amount: income_rows.reduce(
        (s, row) => s + (row.months.find((c) => c.month_id === m.id)?.amount ?? 0),
        0
      ),
    })),
    total: income_rows.reduce((s, row) => s + row.total, 0),
  };

  // Expense rows
  const expenseTransactions = filtered.filter((t) => t.type === "expense");

  const CATEGORY_ORDER = [
    "Combustibles", "Compra Rodados", "Repuestos y Reparaciones", "Peajes",
    "Instalaciones", "Alquileres", "Impuestos", "Sueldos", "Sindicato",
    "Federacion", "Directores", "Gastos bancarios", "Prestamos", "Gastos Varios",
    "RR", "Compra USD",
  ];

  const sortedCategories = [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.name);
    const bi = CATEGORY_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const expense_rows: IncomeStatementRow[] = sortedCategories.map((cat) => {
    const cols = months.map((m) => {
      const monthTxs = expenseTransactions.filter(
        (t) => getEffectiveMonthId(t) === m.id && t.category_id === cat.id
      );
      const amount = monthTxs.reduce(
        (s, t) =>
          s + Math.abs(t.transaction_amounts.reduce((s2, a) => s2 + a.amount, 0)),
        0
      );
      return { month_id: m.id, label: m.label, amount };
    });
    return { label: cat.name, months: cols, total: cols.reduce((s, c) => s + c.amount, 0) };
  });

  const expense_total: IncomeStatementRow = {
    label: "TOTAL EGRESOS",
    months: months.map((m) => ({
      month_id: m.id,
      label: m.label,
      amount: expense_rows.reduce(
        (s, row) => s + (row.months.find((c) => c.month_id === m.id)?.amount ?? 0),
        0
      ),
    })),
    total: expense_rows.reduce((s, row) => s + row.total, 0),
  };

  const net_result: IncomeStatementRow = {
    label: "RESULTADO",
    months: months.map((m) => {
      const inc = income_total.months.find((c) => c.month_id === m.id)?.amount ?? 0;
      const exp = expense_total.months.find((c) => c.month_id === m.id)?.amount ?? 0;
      return { month_id: m.id, label: m.label, amount: inc - exp };
    }),
    total: income_total.total - expense_total.total,
  };

  return {
    months,
    income_rows,
    income_total,
    expense_rows,
    expense_total,
    net_result,
  };
}

// ---------------------------------------------------------------------------
// Legacy: simple summary for backward compatibility
// ---------------------------------------------------------------------------

export type CashFlowMonth = { id: string; label: string };
export type CashFlowTotal = { category_id: string | null; month_id: string; total: number };
export type CashFlowSummary = {
  categories: import("@/lib/db/types").Category[];
  months: CashFlowMonth[];
  totals: CashFlowTotal[];
};

const UNCATEGORIZED_ID = "__uncategorized__";

export async function getCashFlowSummary(
  monthIds: string[],
): Promise<CashFlowSummary | null> {
  if (monthIds.length === 0) return null;

  const supabase = await createClient();

  const [catRes, monthsRes, txRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, description, created_at")
      .order("name", { ascending: true }),
    supabase
      .from("months")
      .select("id, label")
      .in("id", monthIds),
    supabase
      .from("transactions")
      .select("id, month_id, category_id, transaction_amounts (amount)")
      .in("month_id", monthIds)
      .eq("type", "expense"),
  ]);

  if (catRes.error) throw new Error(catRes.error.message);
  if (monthsRes.error) throw new Error(monthsRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);

  const categories = (catRes.data ?? []) as import("@/lib/db/types").Category[];
  const months = (monthsRes.data ?? []) as CashFlowMonth[];
  const transactions = txRes.data ?? [];

  const totalsMap = new Map<string, number>();

  for (const tx of transactions) {
    const amounts = (tx as { transaction_amounts: { amount: number }[] })
      .transaction_amounts;
    const total = (amounts ?? []).reduce((s, a) => s + Number(a.amount), 0);
    const categoryKey = tx.category_id ?? UNCATEGORIZED_ID;
    const key = `${categoryKey}|${tx.month_id}`;
    totalsMap.set(key, (totalsMap.get(key) ?? 0) + total);
  }

  const totals: CashFlowTotal[] = [];
  totalsMap.forEach((total, key) => {
    const [category_id, month_id] = key.split("|");
    totals.push({
      category_id: category_id === UNCATEGORIZED_ID ? null : category_id,
      month_id,
      total,
    });
  });

  const hasUncategorized = totals.some((t) => t.category_id === null);
  const categoriesWithNull = hasUncategorized
    ? [
        ...categories,
        {
          id: UNCATEGORIZED_ID,
          name: "Uncategorized",
          description: null,
          created_at: "",
        } as import("@/lib/db/types").Category,
      ]
    : categories;

  return {
    categories: categoriesWithNull,
    months,
    totals,
  };
}
