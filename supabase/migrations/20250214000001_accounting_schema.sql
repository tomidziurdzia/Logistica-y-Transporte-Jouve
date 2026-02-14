-- Modelos para app de gestión contable
-- Estructura: accounts + months + opening_balances + transactions + transaction_amounts (pivot)

create extension if not exists pgcrypto;

-- =============================================================================
-- 1. ACCOUNTS (cuentas / medios: Caja, Galicia, Provincia, etc.)
-- =============================================================================
-- Agregar o quitar cuentas sin tocar el esquema; display_order = orden de columnas.
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('bank','cash','wallet','investment','checks','other')),
  is_active boolean not null default true,
  allow_negative boolean not null default false,
  opening_balance numeric(18,2) not null default 0,
  opening_balance_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_name_unique unique (name)
);

create index if not exists accounts_active_idx on public.accounts(is_active);

-- =============================================================================
-- 2. CATEGORIES (categorías por nombre; UI puede traducir)
-- =============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint categories_name_unique unique (name)
);

insert into public.categories (name) values
  ('Combustibles'),
  ('Compra Rodados'),
  ('Repuestos y Reparaciones'),
  ('Peajes'),
  ('Instalaciones'),
  ('Alquileres'),
  ('Impuestos'),
  ('Sueldos'),
  ('Sindicato'),
  ('Federacion'),
  ('Directores'),
  ('Gastos bancarios'),
  ('Prestamos'),
  ('Gastos Varios')
on conflict (name) do nothing;

-- =============================================================================
-- 3. MONTHS (periodos mensuales; cada tab del Excel)
-- =============================================================================
create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month >= 1 and month <= 12),
  label text not null,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint months_year_month_unique unique (year, month)
);

create index if not exists months_year_month_idx on public.months(year, month);

-- =============================================================================
-- 4. OPENING_BALANCES (saldos iniciales por mes y cuenta; ej. "SALDO 31/01/26")
-- =============================================================================
-- Al crear un mes nuevo se calcula/copia desde el saldo final del mes anterior.
create table if not exists public.opening_balances (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric(15,2) not null,
  created_at timestamptz not null default now(),
  constraint opening_balances_month_account_unique unique (month_id, account_id)
);

create index if not exists opening_balances_month_idx on public.opening_balances(month_id);
create index if not exists opening_balances_account_idx on public.opening_balances(account_id);

-- =============================================================================
-- 5. TRANSACTIONS (cabecera del movimiento; cada fila de la tabla mensual)
-- =============================================================================
create type public.transaction_type as enum ('income', 'expense', 'internal_transfer');

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months(id) on delete cascade,
  "date" date not null,
  type public.transaction_type not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  row_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_month_idx on public.transactions(month_id);
create index if not exists transactions_date_idx on public.transactions("date");
create index if not exists transactions_type_idx on public.transactions(type);
create index if not exists transactions_category_idx on public.transactions(category_id);

-- =============================================================================
-- 6. TRANSACTION_AMOUNTS (montos por cuenta; pivot de columnas a filas)
-- =============================================================================
-- Solo se guardan celdas con valor; las vacías no existen. TOTAL = SUM(amount).
create table if not exists public.transaction_amounts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric(15,2) not null,
  created_at timestamptz not null default now(),
  constraint transaction_amounts_tx_account_unique unique (transaction_id, account_id)
);

create index if not exists transaction_amounts_tx_idx on public.transaction_amounts(transaction_id);
create index if not exists transaction_amounts_account_idx on public.transaction_amounts(account_id);

-- =============================================================================
-- RLS (descomenta cuando uses auth)
-- =============================================================================
-- alter table public.accounts enable row level security;
-- alter table public.categories enable row level security;
-- alter table public.months enable row level security;
-- alter table public.opening_balances enable row level security;
-- alter table public.transactions enable row level security;
-- alter table public.transaction_amounts enable row level security;
--
-- create policy "accounts_select" on public.accounts for select using (true);
-- create policy "categories_select" on public.categories for select using (true);
-- create policy "months_all" on public.months for all using (true);
-- create policy "opening_balances_all" on public.opening_balances for all using (true);
-- create policy "transactions_all" on public.transactions for all using (true);
-- create policy "transaction_amounts_all" on public.transaction_amounts for all using (true);
