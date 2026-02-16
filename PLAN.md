# Plan: Módulo Flujo de Fondos

## Problema a resolver

Hoy la app tiene el **Diario** (transacciones mensuales), pero falta la **vista consolidada de Flujo de Fondos** que permita:

1. Ver ingresos y egresos agregados por categoría a nivel mensual y anual
2. Distinguir **período de pago vs. período de devengamiento** (ej: pago en febrero que corresponde a enero)
3. Separar **gastos operativos vs. gastos del directorio** (que no son costo real de la empresa)
4. Desglosar cada categoría en subcategorías (Combustible → Axion, YPF, etc.)
5. Distinguir pagos por **Bancos/Efectivo vs. Tarjeta de Crédito**
6. Tener un **Estado de Resultados (P&L)** que muestre el resultado real del negocio

## Diseño de la solución

### Cambios en el modelo de datos

#### 1. Nueva tabla `subcategories` (subcategorías por categoría)
```sql
create table subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);
```
Ejemplos: Categoría "Combustibles" → subcategorías "Axion", "Edenred", "YPF", "Niciforo", "Garrafas", "Otros".

#### 2. Nuevos campos en `transactions`
```sql
alter table transactions add column subcategory_id uuid references subcategories(id) on delete set null;
alter table transactions add column accrual_month_id uuid references months(id) on delete set null;
alter table transactions add column payment_method text check (payment_method in ('bank_cash', 'credit_card')) default 'bank_cash';
alter table transactions add column is_business_expense boolean not null default true;
```

- **`subcategory_id`**: Permite asignar "Axion" dentro de "Combustibles"
- **`accrual_month_id`**: El mes al que corresponde el gasto (devengado). Si es NULL, se asume igual al mes de pago. Esto resuelve "pagué en febrero pero corresponde a enero"
- **`payment_method`**: Distingue Bancos/Efectivo vs. Tarjeta de Crédito
- **`is_business_expense`**: `false` para gastos del directorio y otros no-operativos. Permite filtrarlos del costo real de la empresa

#### 3. Nueva tabla `income_categories` (categorías de ingreso)
```sql
create table income_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
insert into income_categories (name, display_order) values
  ('Fletes', 1), ('Ventas Instalaciones', 2), ('Ventas BU', 3), ('Otros', 4), ('Prestamos', 5);
```

#### 4. Nuevo campo en `transactions` para categoría de ingreso
```sql
alter table transactions add column income_category_id uuid references income_categories(id) on delete set null;
```

### Nuevas páginas y componentes

#### 1. `/cash-flow` — Vista Flujo de Fondos Anual
Página principal que muestra la tabla tipo Excel del FLUJO FONDOS ANUAL:

- **Selector de rango fiscal** (ej: Oct 2025 - Sep 2026)
- **Sección SALDO INICIAL**: Saldos por cuenta (Efectivo, CH Cartera, Bancos, etc.)
- **Sección ENTRADAS**: Fletes, Ventas Instalaciones, Ventas BU, Otros, Préstamos — con subtotal
- **Sección SALIDAS**: Las 16 categorías con subtotal
- **RESULTADO**: Entradas - Salidas
- **SALDO DE CIERRE**: Saldos finales por cuenta
- Cada celda es un link clickeable que abre el detalle mensual

Se calcula **en tiempo real** desde las transacciones del Diario, no es ingreso manual duplicado.

#### 2. `/cash-flow/[monthLabel]` — Detalle Mensual de Egresos
Vista que muestra el desglose de egresos de un mes con subcategorías:

- Estructura: Categoría → Subcategorías (ej: COMBUSTIBLE → Axion, YPF...)
- Dos columnas de totales: **BANCOS/EFECTIVO** y **TARJETA CRÉDITO**
- Toggle para ver/ocultar gastos no-operativos (Directores, etc.)
- Muestra qué gastos están devengados en este mes vs. pagados en este mes

#### 3. `/cash-flow/results` — Estado de Resultados (P&L)
Vista acumulada tipo contable:

- **INGRESOS**: Fletes, Ventas, Ventas BU, Intereses, Otros
- **EGRESOS**: IIBB, Sueldos, Aportes, Combustibles, Seguros, Repuestos, etc.
- **RESULTADO**: Ingresos - Egresos
- Toggle: Criterio **pagado** vs. criterio **devengado** (usa `accrual_month_id`)
- Toggle: Incluir/Excluir gastos no-operativos

### Cambios al Diario existente (MonthTransactionsTable)

Se agregan columnas opcionales al crear/editar transacciones:

- **Subcategoría** (dropdown filtrado por categoría seleccionada)
- **Método de pago** (Banco/Efectivo o Tarjeta — solo para egresos)
- **Mes devengado** (dropdown de meses disponibles — solo si difiere del mes actual)
- **Gasto operativo** (checkbox, default: sí — se desmarca para Directores, etc.)
- **Categoría de ingreso** (dropdown — solo para type=income)

### Navegación

Se agrega al sidebar:
```
- Períodos (existente)
- Flujo de Fondos (nuevo)
  - Vista Anual
  - Estado de Resultados
- Clientes (placeholder)
- Configuración (placeholder)
```

### Server actions nuevos

- `getCashFlowAnnual(startYear, startMonth, endYear, endMonth)` — Agrega transacciones por categoría y mes, calcula saldos
- `getCashFlowMonthDetail(monthId)` — Transacciones agrupadas por categoría/subcategoría con totales por método de pago
- `getIncomeStatement(startYear, startMonth, endYear, endMonth, accrualBasis: boolean)` — P&L con opción pagado/devengado
- `getSubcategories()` — Lista todas las subcategorías
- `getIncomeCategories()` — Lista categorías de ingreso

## Orden de implementación

1. **Migración DB**: Crear tablas `subcategories`, `income_categories` + nuevos campos en `transactions`
2. **Seed de subcategorías**: Popular con los datos del Excel (Axion, YPF, etc.)
3. **Types + Server actions**: Nuevos tipos TS y funciones de consulta
4. **Hooks**: React Query hooks para los nuevos endpoints
5. **Actualizar MonthTransactionsTable**: Agregar los campos nuevos al crear/editar transacciones
6. **Página `/cash-flow`**: Vista anual consolidada (tabla)
7. **Página `/cash-flow/[monthLabel]`**: Detalle mensual con subcategorías
8. **Página `/cash-flow/results`**: Estado de Resultados / P&L
9. **Sidebar**: Agregar navegación al módulo
