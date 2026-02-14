-- Políticas RLS: usuarios autenticados pueden leer y escribir en las tablas del módulo contable.
-- Si ya activaste RLS en el dashboard, solo hace falta crear las políticas.
-- Ejecuta esto en el SQL Editor de Supabase si no usas supabase db push.

-- months: permitir todo a autenticados (necesario para "Crear mes actual")
create policy "months_authenticated_all"
  on public.months
  for all
  to authenticated
  using (true)
  with check (true);

-- accounts: necesario para listar cuentas en la vista del mes
create policy "accounts_authenticated_all"
  on public.accounts
  for all
  to authenticated
  using (true)
  with check (true);

-- opening_balances, transactions y transaction_amounts: necesarios para la vista del mes
create policy "opening_balances_authenticated_all"
  on public.opening_balances for all to authenticated using (true) with check (true);

create policy "transactions_authenticated_all"
  on public.transactions for all to authenticated using (true) with check (true);

create policy "transaction_amounts_authenticated_all"
  on public.transaction_amounts for all to authenticated using (true) with check (true);

-- categories (por si usás categorías en transacciones)
-- create policy "categories_authenticated_all" on public.categories for all to authenticated using (true) with check (true);
