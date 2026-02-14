-- Seed completo: cuentas + mes Feb 2026 + saldos iniciales + muchas transacciones de ejemplo.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).

-- 1) Cuentas
insert into public.accounts (name, type, opening_balance, opening_balance_date)
values
  ('Caja', 'cash', 0, '2026-01-01'),
  ('Cambio', 'cash', 0, '2026-01-01'),
  ('Banco Galicia', 'bank', 0, '2026-01-01'),
  ('Banco Provincia', 'bank', 0, '2026-01-01'),
  ('Banco Macro', 'bank', 0, '2026-01-01'),
  ('Mercado Pago', 'wallet', 0, '2026-01-01'),
  ('FIMA', 'investment', 0, '2026-01-01'),
  ('Cheques físicos', 'checks', 0, '2026-01-01'),
  ('Cheques electrónicos', 'checks', 0, '2026-01-01')
on conflict (name) do nothing;

-- 2) Mes Febrero 2026 (si no existe)
insert into public.months (year, month, label)
values (2026, 2, 'Febrero 26')
on conflict (year, month) do nothing;

-- 3) Saldos iniciales del mes (todas las cuentas en 0)
insert into public.opening_balances (month_id, account_id, amount)
select m.id, a.id, 0
from public.months m
cross join public.accounts a
where m.year = 2026 and m.month = 2
on conflict (month_id, account_id) do nothing;

-- 4) Muchas transacciones de ejemplo (ingresos, egresos, transferencias)
-- Cada bloque: 1 transacción + sus montos.

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-01', 'income', 'Cobro flete', 1 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 500000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-01', 'expense', 'Combustible', 2 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -180000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-02', 'income', 'Venta contado', 3 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 193150 from ins, public.accounts a where a.name = 'Mercado Pago';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-02', 'expense', 'Peaje', 4 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -25000 from ins, public.accounts a where a.name = 'Banco Provincia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-03', 'internal_transfer', 'Paso a caja', 5 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, v.amount from ins cross join (values ('Banco Galicia', -100000::numeric), ('Caja', 100000)) as v(name, amount) join public.accounts a on a.name = v.name;

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-03', 'income', 'Cobro cliente A', 6 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 750000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-04', 'expense', 'Repuestos', 7 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -320000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-04', 'income', 'Flete B', 8 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 450000 from ins, public.accounts a where a.name = 'Banco Provincia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-05', 'expense', 'Sueldos', 9 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -1200000 from ins, public.accounts a where a.name = 'Banco Macro';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-05', 'expense', 'Alquiler', 10 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -280000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-06', 'income', 'Cobro C', 11 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 620000 from ins, public.accounts a where a.name = 'Mercado Pago';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-06', 'expense', 'Impuestos', 12 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -155000 from ins, public.accounts a where a.name = 'Banco Provincia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-07', 'income', 'Flete D', 13 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 890000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-07', 'expense', 'Gastos bancarios', 14 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -8500 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-08', 'internal_transfer', 'Refuerzo Provincia', 15 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, v.amount from ins cross join (values ('Banco Galicia', -200000::numeric), ('Banco Provincia', 200000)) as v(name, amount) join public.accounts a on a.name = v.name;

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-08', 'expense', 'Peaje', 16 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -18000 from ins, public.accounts a where a.name = 'Caja';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-09', 'income', 'Cobro E', 17 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 410000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-09', 'expense', 'Combustible', 18 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -220000 from ins, public.accounts a where a.name = 'Banco Macro';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-10', 'income', 'Venta F', 19 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 310000 from ins, public.accounts a where a.name = 'Mercado Pago';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-10', 'expense', 'Sindicato', 20 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -95000 from ins, public.accounts a where a.name = 'Banco Provincia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-11', 'income', 'Flete G', 21 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 580000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-11', 'expense', 'Instalaciones', 22 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -67000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-12', 'income', 'Cobro H', 23 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 920000 from ins, public.accounts a where a.name = 'Banco Provincia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-12', 'expense', 'Prestamos', 24 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -350000 from ins, public.accounts a where a.name = 'Banco Macro';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-13', 'income', 'Venta I', 25 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 145000 from ins, public.accounts a where a.name = 'Mercado Pago';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-13', 'expense', 'Gastos varios', 26 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -42000 from ins, public.accounts a where a.name = 'Caja';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-14', 'income', 'Flete J', 27 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 720000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-14', 'expense', 'Directores', 28 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -500000 from ins, public.accounts a where a.name = 'Banco Macro';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-15', 'internal_transfer', 'MP a Galicia', 29 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, v.amount from ins cross join (values ('Mercado Pago', -150000::numeric), ('Banco Galicia', 150000)) as v(name, amount) join public.accounts a on a.name = v.name;

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-15', 'income', 'Cobro K', 30 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 380000 from ins, public.accounts a where a.name = 'Banco Provincia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-16', 'expense', 'Reparaciones', 31 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -185000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-17', 'income', 'Flete L', 32 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 540000 from ins, public.accounts a where a.name = 'Banco Galicia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-18', 'expense', 'Federacion', 33 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -72000 from ins, public.accounts a where a.name = 'Banco Provincia';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-19', 'income', 'Cobro M', 34 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, 660000 from ins, public.accounts a where a.name = 'Mercado Pago';

with m as (select id from public.months where year = 2026 and month = 2 limit 1),
     ins as (insert into public.transactions (month_id, date, type, description, row_order) select m.id, '2026-02-20', 'expense', 'Combustible', 35 from m returning id)
insert into public.transaction_amounts (transaction_id, account_id, amount) select ins.id, a.id, -195000 from ins, public.accounts a where a.name = 'Banco Galicia';
