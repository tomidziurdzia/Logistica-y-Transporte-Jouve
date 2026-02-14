-- Cuentas por defecto (solo columnas que existen en public.accounts)
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
