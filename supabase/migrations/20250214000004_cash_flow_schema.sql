-- =============================================================================
-- Módulo Flujo de Fondos: subcategorías, categorías de ingreso, campos nuevos
-- =============================================================================

-- 1. SUBCATEGORIES (desglose por categoría: Combustibles → Axion, YPF, etc.)
create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint subcategories_category_name_unique unique (category_id, name)
);

create index if not exists subcategories_category_idx on public.subcategories(category_id);

-- 2. INCOME_CATEGORIES (categorías de ingreso: Fletes, Ventas Instalaciones, etc.)
create table if not exists public.income_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint income_categories_name_unique unique (name)
);

insert into public.income_categories (name, display_order) values
  ('Fletes', 1),
  ('Ventas Instalaciones', 2),
  ('Ventas BU', 3),
  ('Otros', 4),
  ('Prestamos', 5)
on conflict (name) do nothing;

-- 3. Nuevos campos en transactions
alter table public.transactions
  add column if not exists subcategory_id uuid references public.subcategories(id) on delete set null;

alter table public.transactions
  add column if not exists income_category_id uuid references public.income_categories(id) on delete set null;

alter table public.transactions
  add column if not exists accrual_month_id uuid references public.months(id) on delete set null;

alter table public.transactions
  add column if not exists payment_method text not null default 'bank_cash'
    check (payment_method in ('bank_cash', 'credit_card'));

alter table public.transactions
  add column if not exists is_business_expense boolean not null default true;

create index if not exists transactions_subcategory_idx on public.transactions(subcategory_id);
create index if not exists transactions_income_category_idx on public.transactions(income_category_id);
create index if not exists transactions_accrual_month_idx on public.transactions(accrual_month_id);
create index if not exists transactions_payment_method_idx on public.transactions(payment_method);
create index if not exists transactions_business_expense_idx on public.transactions(is_business_expense);

-- 4. Seed subcategorías (del Excel FLUJO DE FONDOS 2026)

-- Combustibles
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('Axion',1),('Edenred',2),('Niciforo',3),('YPF',4),('Garrafas',5),('Otros',6))
  as s(name, ord)
where c.name = 'Combustibles'
on conflict (category_id, name) do nothing;

-- Compra Rodados
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('Toyota',1),('Atego',2),('Hermann',3),('Leasing',4),('Zorra',5))
  as s(name, ord)
where c.name = 'Compra Rodados'
on conflict (category_id, name) do nothing;

-- Repuestos y Reparaciones (por patente + proveedores)
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('PBH',1),('HMN',2),('HOF',3),('LLB',4),('CQ',5),('YI',6),('MRO',7),('EZ',8),
          ('HJD',9),('VY',10),('OZ',11),('OY',12),('UF',13),('TJ',14),('NVR',15),('IMY',16),
          ('UH',17),('FP (Hermann)',18),('Autoelevadores/Apilador',19),
          ('Testa',20),('Casa Martin',21),('Hernandez',22),('Romeo',23))
  as s(name, ord)
where c.name = 'Repuestos y Reparaciones'
on conflict (category_id, name) do nothing;

-- Peajes
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('Autopistas Urbanas',1),('AUBASA',2),('Caminos del Rio Uruguay',3),
          ('Corredores Viales',4),('Autopistas del Oeste',5),('Autopistas del Sol',6),
          ('Buen Ayre',7),('Telepeaje',8),('Autopistas del Sur',9),('CVSA',10),('Otros',11))
  as s(name, ord)
where c.name = 'Peajes'
on conflict (category_id, name) do nothing;

-- Instalaciones
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('PEISA',1),('Rehau',2),('Konecta',3),('Rowa',4),('Suminox',5),('Passaro',6),('Obras',7))
  as s(name, ord)
where c.name = 'Instalaciones'
on conflict (category_id, name) do nothing;

-- Alquileres
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('Gowland',1),('CABA',2),('Mercedes',3))
  as s(name, ord)
where c.name = 'Alquileres'
on conflict (category_id, name) do nothing;

-- Impuestos
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('F931',1),('IVA',2),('IIGG',3),('Mis facilidades',4),('IIBB',5),
          ('IIBB Cuotas',6),('B A y P',7),('Patentes',8),('Impuestos tarjeta',9))
  as s(name, ord)
where c.name = 'Impuestos'
on conflict (category_id, name) do nothing;

-- Sueldos
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('Mensual',1),('Semanal',2),('Extras/BONO',3),('Adelantos',4),
          ('Liq. Final',5),('Vacaciones/SAC',6))
  as s(name, ord)
where c.name = 'Sueldos'
on conflict (category_id, name) do nothing;

-- Sindicato
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('Boleta',1),('Efectivo',2),('OS',3),('OSECAC',4))
  as s(name, ord)
where c.name = 'Sindicato'
on conflict (category_id, name) do nothing;

-- Directores
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('DZ Milagros',1),('DZ Walter',2))
  as s(name, ord)
where c.name = 'Directores'
on conflict (category_id, name) do nothing;

-- Prestamos
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('Galicia',1),('Macro',2),('Provincia',3))
  as s(name, ord)
where c.name = 'Prestamos'
on conflict (category_id, name) do nothing;

-- Gastos Varios
insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('DZ Alberto',1),('DZ Adriana',2),('Esperanza Mutuo',3),('Oleiros',4),
          ('Matafuegos',5),('Film',6),('Luz',7),('Interfas',8),('Invismer',9),
          ('Giorgi',10),('Coop. Levin',11),('ISA',12),('Parquero',13),
          ('Marina (limpieza)',14),('Librería',15),('Agua',16),('Viandas',17),
          ('Supermercado',18),('Facturas',19),('Rabanito',20),('Cestari',21),
          ('Telefono',22),('Seguro',23),('Medife',24),('CH RECHAZADOS',25),
          ('Auditoria',26),('Cargas Generales',27),('Psicofisicos',28),
          ('Bromatologia',29),('Senasa',30),('Patentamientos/08',31),
          ('Rutas',32),('MULTAS',33),('Varios',34))
  as s(name, ord)
where c.name = 'Gastos Varios'
on conflict (category_id, name) do nothing;

-- RR (nueva categoría si no existe)
insert into public.categories (name) values ('RR') on conflict (name) do nothing;

insert into public.subcategories (category_id, name, display_order)
select c.id, s.name, s.ord from public.categories c,
  (values ('Merlini',1),('Rijavec',2),('Denitolis',3),('Solivella',4),('Dimaro',5),
          ('Delveccio',6),('Odda',7),('Ilariucci',8),('Simionato',9),('Retegui',10),
          ('Mejias',11),('Bertoli',12),('Dipieri',13),('Tassara',14),('Garrido',15),
          ('Viggiano',16),('Garbino',17),('DZ Milagros',18),('DZ Walter',19))
  as s(name, ord)
where c.name = 'RR'
on conflict (category_id, name) do nothing;

-- Compra USD (nueva categoría si no existe)
insert into public.categories (name) values ('Compra USD') on conflict (name) do nothing;
