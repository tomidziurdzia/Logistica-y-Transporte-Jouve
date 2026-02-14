-- Añadir tipo "adjustment" (ajuste) para cuando las cuentas no cierran
alter type public.transaction_type add value if not exists 'adjustment';
