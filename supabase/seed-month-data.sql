-- Seed de datos para un mes: saldos iniciales + transacciones con montos.
-- Ejecutar después de tener al menos un mes (creado desde la app) y las cuentas (seed-accounts.sql).
-- Usa el mes más reciente por created_at.

-- 1) Saldos iniciales del mes (todas las cuentas en 0 si no existen)
insert into public.opening_balances (month_id, account_id, amount)
select m.id, a.id, 0
from (select id from public.months order by created_at desc limit 1) m
cross join public.accounts a
on conflict (month_id, account_id) do nothing;

-- 2) Transacciones de ejemplo (ingresos, egresos, transferencia)
-- Cada bloque inserta 1 transacción y sus montos por cuenta.

-- Ingreso: cobro en Galicia
with m as (select id from public.months order by created_at desc limit 1),
     ins as (
       insert into public.transactions (month_id, date, type, description, row_order)
       select m.id, '2026-02-01', 'income', 'Cobro flete', 1 from m
       returning id
     )
insert into public.transaction_amounts (transaction_id, account_id, amount)
select ins.id, a.id, 500000
from ins, public.accounts a
where a.name = 'Banco Galicia';

-- Egreso: pago desde Galicia
with m as (select id from public.months order by created_at desc limit 1),
     ins as (
       insert into public.transactions (month_id, date, type, description, row_order)
       select m.id, '2026-02-02', 'expense', 'Combustible', 2 from m
       returning id
     )
insert into public.transaction_amounts (transaction_id, account_id, amount)
select ins.id, a.id, -150000
from ins, public.accounts a
where a.name = 'Banco Galicia';

-- Ingreso: cobro en Mercado Pago
with m as (select id from public.months order by created_at desc limit 1),
     ins as (
       insert into public.transactions (month_id, date, type, description, row_order)
       select m.id, '2026-02-03', 'income', 'Venta', 3 from m
       returning id
     )
insert into public.transaction_amounts (transaction_id, account_id, amount)
select ins.id, a.id, 193150
from ins, public.accounts a
where a.name = 'Mercado Pago';

-- Transferencia interna: de Galicia a Caja
with m as (select id from public.months order by created_at desc limit 1),
     ins as (
       insert into public.transactions (month_id, date, type, description, row_order)
       select m.id, '2026-02-05', 'internal_transfer', 'Paso a caja', 4 from m
       returning id
     )
insert into public.transaction_amounts (transaction_id, account_id, amount)
select ins.id, a.id, v.amount
from ins
cross join (
  select 'Banco Galicia' as name, -100000::numeric as amount
  union all
  select 'Caja', 100000
) v
join public.accounts a on a.name = v.name;

-- Egreso: pago desde Provincia
with m as (select id from public.months order by created_at desc limit 1),
     ins as (
       insert into public.transactions (month_id, date, type, description, row_order)
       select m.id, '2026-02-10', 'expense', 'Peaje', 5 from m
       returning id
     )
insert into public.transaction_amounts (transaction_id, account_id, amount)
select ins.id, a.id, -25000
from ins, public.accounts a
where a.name = 'Banco Provincia';
