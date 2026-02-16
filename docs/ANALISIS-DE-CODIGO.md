# Análisis de Código — Logística y Transporte Jouve

**Fecha:** 16 de Febrero de 2026  
**Rama:** `cursor/an-lisis-de-c-digo-9920`  
**Estado general:** El proyecto compila sin errores, pasa ESLint sin problemas en el código fuente, y la estructura es coherente y mantenible.

---

## 1. Descripción General del Proyecto

Aplicación de **gestión contable** para la empresa "Logística y Transporte Jouve", construida con:

| Tecnología | Versión / Detalle |
|---|---|
| **Next.js** | App Router (última versión) con Partial Prerendering |
| **React** | 19.x |
| **Supabase** | Auth + PostgreSQL (SSR con cookies) |
| **TanStack React Query** | 5.x para client-side data fetching |
| **Tailwind CSS** | 3.4.x + tailwindcss-animate |
| **shadcn/ui** | Componentes UI con Radix primitives |
| **TypeScript** | Strict mode habilitado |

### Funcionalidades principales

1. **Autenticación:** Login, registro, recuperación de contraseña (Supabase Auth).
2. **Dashboard de meses:** Visualización de períodos contables.
3. **Vista de mes:** Tabla editable de transacciones con saldos de apertura por cuenta.
4. **Flujo de fondos:** Resumen de egresos por categoría comparando múltiples meses.
5. **Gestión de transacciones:** CRUD completo (crear, editar, eliminar) con soporte para ingresos, egresos, transferencias internas y ajustes.

---

## 2. Arquitectura y Estructura de Carpetas

```
app/
├── layout.tsx                     # Layout raíz (font, theme, QueryProvider)
├── globals.css                    # Variables CSS + Tailwind
├── auth/                          # Flujos de autenticación (sin sidebar)
│   ├── login/, sign-up/, forgot-password/, ...
│   ├── confirm/route.ts           # Verificación OTP
│   └── logout/route.ts            # Cerrar sesión
├── actions/                       # Server Actions (capa de datos)
│   ├── months.ts, transactions.ts, accounts.ts, categories.ts, cash-flow.ts
├── (dashboard)/                   # Route group con sidebar (no afecta URL)
│   ├── layout.tsx                 # Auth guard + sidebar
│   ├── page.tsx                   # Home: lista de meses
│   ├── month/[monthId]/           # Vista de un mes
│   └── cash-flow/                 # Resumen de flujo de fondos
components/
├── ui/                            # shadcn/ui primitives
├── auth/                          # Formularios de autenticación
├── providers/                     # QueryProvider
├── app-sidebar.tsx, app-breadcrumb.tsx, ...
hooks/                             # Custom hooks con React Query
lib/
├── db/types.ts                    # Interfaces TypeScript
├── supabase/                      # Clientes Supabase (server, client, proxy)
├── format.ts, utils.ts
supabase/
├── migrations/                    # Schema SQL
├── seed*.sql
```

**Evaluación:** La estructura sigue las convenciones de Next.js App Router correctamente. El uso de `(dashboard)` como route group es apropiado para separar las rutas protegidas de las de auth. La separación en `actions/`, `hooks/`, `components/` y `lib/` es clara.

---

## 3. Resultados de Build y Lint

| Herramienta | Resultado |
|---|---|
| `next build` | Compila exitosamente (14 rutas generadas) |
| `eslint` (solo fuente) | 0 errores, 0 warnings |
| TypeScript (strict) | Sin errores de tipos |

---

## 4. Aspectos Positivos

### 4.1 Tipado fuerte y consistente
- Todas las entidades del dominio tienen interfaces TypeScript definidas en `lib/db/types.ts`.
- Los Server Actions tienen tipos de entrada/salida bien definidos (`CreateTransactionInput`, `UpdateTransactionInput`, etc.).
- `TransactionType` y `AccountType` son union types estrictos.

### 4.2 Separación de responsabilidades
- **Server Actions** (`app/actions/`) encapsulan toda la lógica de acceso a datos.
- **Custom hooks** (`hooks/`) encapsulan las queries de React Query con claves de cache consistentes.
- **Componentes** manejan solo la lógica de presentación.

### 4.3 Patrón de datos bien diseñado
- El esquema de base de datos usa un modelo normalizado (EAV para montos por cuenta a través de `transaction_amounts`).
- Las migraciones son incrementales y bien documentadas.
- Opening balances + transactions permiten calcular saldos de cierre.

### 4.4 Buen uso de React Query
- Claves de query consistentes y exportadas (`monthsQueryKey`, `accountsQueryKey`).
- Invalidación correcta después de mutaciones.
- `staleTime` de 60s configurado globalmente para evitar re-fetches innecesarios.

### 4.5 UX cuidada
- Tabla de transacciones con edición inline, filtros, y ordenamiento.
- Modal de transferencia interna con auto-descripción.
- Validaciones claras en español antes de guardar.
- Soporte de dark mode.

---

## 5. Problemas Encontrados y Recomendaciones

### 5.1 CRÍTICO — Middleware exportado incorrectamente

**Archivo:** `proxy.ts` (raíz del proyecto)

```typescript
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}
```

El middleware de Next.js debe exportar una función llamada `middleware`, no `proxy`. Además, debería estar en un archivo llamado `middleware.ts` en la raíz. Actualmente el archivo se llama `proxy.ts` y la función se llama `proxy`, lo cual no sigue la convención de Next.js para middleware. Sin embargo, el build muestra "Proxy (Middleware)" lo que sugiere que Next.js lo reconoce de alguna forma, posiblemente a través de la configuración. **Verificar que el middleware se ejecuta correctamente en producción.**

**Recomendación:** Renombrar a `middleware.ts` y la función a `middleware` para seguir la convención estándar.

---

### 5.2 ALTO — Uso de `getSession()` en lugar de `getClaims()` / `getUser()` para auth guard

**Archivo:** `app/(dashboard)/layout.tsx` (línea 19)

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

Según la documentación de Supabase, `getSession()` lee la sesión del storage local/cookies sin verificarla con el servidor. Para un auth guard del lado del servidor, se recomienda usar `getUser()` que verifica el token con Supabase. Un usuario podría manipular la cookie de sesión para saltear esta verificación.

**Recomendación:** Cambiar a:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/auth/login");
```

Mismo problema en `app/auth/login/page.tsx` (línea 8).

---

### 5.3 ALTO — Validación de entrada ausente en Server Actions

**Archivos:** `app/actions/transactions.ts`, `app/actions/months.ts`

Los Server Actions no validan los datos de entrada del lado del servidor. Cualquier usuario autenticado podría enviar datos malformados directamente a las acciones:

- `monthId` no se valida como UUID válido.
- `date` no se valida como fecha válida.
- `amount` no se valida como número (podría enviar NaN o Infinity).
- `year` y `month` en `createMonth` no tienen validación de rango.

**Recomendación:** Agregar una librería de validación como `zod` para validar todas las entradas en Server Actions:

```typescript
import { z } from "zod";

const createTransactionSchema = z.object({
  month_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["income", "expense", "internal_transfer", "adjustment"]),
  description: z.string().min(1),
  category_id: z.string().uuid().nullable().optional(),
  amounts: z.array(z.object({
    account_id: z.string().uuid(),
    amount: z.number().finite(),
  })),
});
```

---

### 5.4 ALTO — RLS deshabilitado en la migración base

**Archivo:** `supabase/migrations/20250214000001_accounting_schema.sql`

Las líneas de RLS están comentadas en la primera migración. Si bien la segunda migración (`20250214000002_rls_policies.sql`) crea las policies, **no habilita RLS** (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Esto significa que las policies no tienen efecto a menos que RLS se haya habilitado manualmente desde el dashboard de Supabase.

**Recomendación:** Agregar una migración que habilite RLS explícitamente:

```sql
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_amounts ENABLE ROW LEVEL SECURITY;
```

---

### 5.5 ALTO — Policies RLS demasiado permisivas

**Archivo:** `supabase/migrations/20250214000002_rls_policies.sql`

Todas las policies son `using (true) with check (true)` para `authenticated`. Esto significa que cualquier usuario autenticado puede ver y modificar TODOS los datos de TODOS los usuarios. En una aplicación multi-tenant o con múltiples usuarios, esto es un problema serio.

**Recomendación:** Si la app es multi-usuario, agregar una columna `user_id` a las tablas y filtrar por el usuario actual:
```sql
CREATE POLICY "months_own" ON public.months
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Si es single-tenant (solo un equipo), documentar esta decisión claramente.

---

### 5.6 MEDIO — Dependencias con versión `latest`

**Archivo:** `package.json`

```json
"@supabase/ssr": "latest",
"@supabase/supabase-js": "latest",
"next": "latest",
```

Usar `latest` es riesgoso para producción. Una actualización breaking puede romper el deploy sin previo aviso.

**Recomendación:** Fijar las versiones exactas o usar rangos de semver:
```json
"@supabase/ssr": "^0.5.0",
"@supabase/supabase-js": "^2.49.0",
"next": "^15.3.0",
```

---

### 5.7 MEDIO — Componente `MonthTransactionsTable` excesivamente grande

**Archivo:** `components/month-transactions-table.tsx` (1170 líneas)

Este componente concentra demasiada lógica:
- Gestión de drafts
- Edición inline
- Modal de transferencia
- Modal de eliminación
- Filtrado y ordenamiento
- Validación de formularios

**Recomendación:** Extraer en componentes y hooks más pequeños:
- `useTransactionForm()` — lógica de edición/creación
- `useTransactionFilters()` — lógica de filtrado
- `TransferModal` — componente separado
- `DeleteConfirmDialog` — componente separado
- `TransactionRow` — componente para cada fila

---

### 5.8 MEDIO — Catch blocks vacíos en mutaciones

**Archivo:** `components/month-transactions-table.tsx` (líneas 369, 461, 474)

```typescript
} catch {
  // Error from mutation
}
```

Los errores se silencian. Aunque React Query muestra errores via `isError`, el `try/catch` puede ocultar problemas inesperados.

**Recomendación:** Al menos loguear el error o usar `onError` de React Query para mostrar notificaciones.

---

### 5.9 MEDIO — Idioma inconsistente en la UI

La interfaz mezcla español e inglés:
- **Español:** "Agregar fila", "Flujo de fondos", "Categoría", validaciones
- **Inglés:** "Periods", "Months", "Income", "Expense", "Opening Balance", "Closing Balance", "Home"

**Recomendación:** Unificar todo a español o implementar i18n con `next-intl`.

---

### 5.10 MEDIO — Falta manejo de errores global

No hay un `error.tsx` global en el dashboard que capture errores no manejados en Server Components. Si una Server Action falla en la carga inicial, no hay un UI de error elegante.

**Recomendación:** Agregar `app/(dashboard)/error.tsx` y `app/error.tsx` como error boundaries.

---

### 5.11 BAJO — Patrón `mounted` repetido innecesariamente

**Archivos:** `components/dashboard-months.tsx`, `components/month-view.tsx`, `components/app-sidebar.tsx`

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return loadingPlaceholder;
```

Este patrón se usa para evitar hydration mismatches, pero en estos casos React Query ya maneja `isLoading`. El `mounted` check es redundante en la mayoría de los casos cuando el componente no depende de APIs del navegador.

**Recomendación:** Evaluar si el check de `mounted` es realmente necesario en cada caso. Si es solo por React Query, `isLoading` ya cubre ese caso.

---

### 5.12 BAJO — `DashboardMonths` no navega a los meses

**Archivo:** `components/dashboard-months.tsx`

El listado de meses en el dashboard muestra solo texto sin links:

```tsx
<li key={m.id} className="text-sm">
  {m.label}
</li>
```

No se puede hacer clic en un mes para navegar a él desde la página principal.

**Recomendación:** Envolver cada mes en un `<Link href={/month/${m.id}}>`.

---

### 5.13 BAJO — `next.config.ts` usa opción no documentada

**Archivo:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  cacheComponents: true,
};
```

`cacheComponents` no es una opción documentada de Next.js estándar. Podría ser una opción experimental o de una versión canary.

**Recomendación:** Verificar que esta opción es válida para la versión de Next.js utilizada, o removerla si no tiene efecto.

---

### 5.14 BAJO — Falta de loading states en el Schema

**Archivo:** `components/ui/skeleton.tsx` (existe pero no se usa)

Hay un componente `Skeleton` disponible pero no se utiliza en ningún lado. Los loading states usan solo texto "Loading..." plano.

**Recomendación:** Usar `Skeleton` para mejorar la UX percibida durante la carga.

---

### 5.15 BAJO — No hay tests

No existen tests unitarios ni de integración en el proyecto.

**Recomendación:** Agregar al menos:
- Tests unitarios para `lib/format.ts` (formatCurrency).
- Tests de componentes clave con React Testing Library.
- Tests e2e con Playwright para flujos críticos (login, crear mes, crear transacción).

---

## 6. Seguridad — Resumen

| Aspecto | Estado | Prioridad |
|---|---|---|
| Auth guard usa `getSession()` (no verifica token) | Mejorable | Alta |
| Server Actions sin validación de entrada | Falta | Alta |
| RLS posiblemente deshabilitado | Verificar | Alta |
| Policies RLS excesivamente permisivas | Mejorable | Alta |
| Variables de entorno con `!` (non-null assertion) | Aceptable (falla rápido) | Baja |
| No hay rate limiting en Server Actions | Falta (depende de infra) | Media |

---

## 7. Performance — Resumen

| Aspecto | Estado |
|---|---|
| React Query con staleTime adecuado | OK |
| Partial Prerendering habilitado | OK |
| `useMemo` para cálculos pesados | OK |
| `useCallback` para handlers de tabla | OK |
| Suspense boundaries en layouts | OK |
| Tabla grande sin virtualización | Posible problema con muchas transacciones |
| `getTotal` en cash-flow usa `.find()` en loop | O(n*m), pero aceptable con pocos datos |

**Recomendación para tablas grandes:** Si un mes puede tener cientos de transacciones, considerar virtualización con `@tanstack/react-virtual`.

---

## 8. Base de Datos — Resumen

| Aspecto | Estado |
|---|---|
| Esquema normalizado | OK |
| Índices en campos de filtro/join | OK |
| Constraints de unicidad | OK |
| Foreign keys con ON DELETE apropiado | OK |
| Categorías pre-cargadas en migración | OK |
| Constraint en `months` (year, month unique) | OK |
| Tipos custom (transaction_type enum) | OK |

**Observación:** La migración 3 agrega `adjustment` al enum `transaction_type`. Esto es correcto, pero tener en cuenta que los enums en PostgreSQL no permiten eliminar valores una vez agregados.

---

## 9. Conclusiones

El proyecto está **bien estructurado** y sigue buenas prácticas de Next.js + React. El código es legible, bien tipado, y la separación de capas es clara. Las principales áreas de mejora son:

1. **Seguridad (Alta prioridad):** Validar entradas en Server Actions, verificar tokens correctamente, y asegurar que RLS esté habilitado.
2. **Refactoring (Media prioridad):** Extraer el componente `MonthTransactionsTable` en piezas más manejables.
3. **Consistencia (Media prioridad):** Unificar el idioma de la UI.
4. **Testing (Baja prioridad inicial):** Agregar tests para los flujos críticos.
5. **Dependencias (Media prioridad):** Fijar versiones para estabilidad en producción.
