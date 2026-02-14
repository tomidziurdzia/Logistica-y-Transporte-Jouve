# Estructura de carpetas – Next.js App Router

Guía para organizar rutas y componentes en este proyecto.

---

## 1. Regla básica: la carpeta = la URL

En Next.js (App Router), **cada carpeta dentro de `app/` define una ruta**:

```
app/
├── page.tsx          →  Ruta: /
├── layout.tsx        →  Layout que envuelve TODAS las páginas
├── auth/
│   ├── login/
│   │   └── page.tsx  →  Ruta: /auth/login
│   ├── sign-up/
│   │   └── page.tsx  →  Ruta: /auth/sign-up
│   └── ...
```

- **`page.tsx`** = la página que se ve en esa ruta.
- **`layout.tsx`** = estructura común (sidebar, header, etc.) para esa ruta y sus hijas.
- Las carpetas **no** llevan `page.tsx` no son visitables por URL (ej. `auth` sin `auth/page.tsx`).

---

## 2. Estructura recomendada para esta app

```
app/
├── layout.tsx              # HTML, body, tema, sidebar global
├── page.tsx                 # Página de inicio (/)
│
├── auth/                    # Todo lo de autenticación (sin sidebar “de app”)
│   ├── login/page.tsx
│   ├── sign-up/page.tsx
│   ├── forgot-password/page.tsx
│   ├── update-password/page.tsx
│   ├── sign-up-success/page.tsx
│   ├── error/page.tsx
│   ├── confirm/route.ts     # Callback de Supabase (email)
│   └── logout/route.ts      # Cerrar sesión
│
└── (dashboard)/             # Opcional: rutas que comparten layout con sidebar
    ├── layout.tsx           # Si quieres un layout distinto solo para “área app”
    ├── page.tsx             # Podría ser / o /dashboard según cómo lo definas
    ├── clientes/page.tsx    # Ej: /clientes (si usas (dashboard))
    └── envios/page.tsx      # Ej: /envios
```

### Qué va en cada sitio

| Dónde | Qué va |
|-------|--------|
| **`app/layout.tsx`** | Lo que envuelve toda la app: `<html>`, `<body>`, tema (ThemeProvider), y si quieres **un solo** sidebar para todo, aquí. |
| **`app/page.tsx`** | Contenido de la **página de inicio** (`/`): mensaje de bienvenida, datos de usuario si hay sesión, etc. |
| **`app/auth/*`** | Páginas y rutas de **autenticación**: login, registro, recuperar contraseña, confirmación, logout. Suelen ser pantallas “sueltas” (sin sidebar de la app). |
| **`app/(dashboard)/`** | Opcional. Rutas que **comparten el mismo layout** (por ejemplo sidebar + header). El `(dashboard)` no aparece en la URL. |

---

## 3. Carpetas entre paréntesis: grupos de rutas

Las carpetas **`(nombre)`** son “route groups”: organizan archivos **sin cambiar la URL**.

- `app/(dashboard)/page.tsx`  →  ruta **`/`** (no `/dashboard`).
- `app/(dashboard)/clientes/page.tsx`  →  ruta **`/clientes`**.

Sirven para:

- Aplicar **un layout distinto** solo a un grupo de rutas (por ejemplo sidebar solo en “área logística”).
- Ordenar mejor los archivos sin afectar las URLs.

Para tu caso actual, con una sola página principal (`/`) y auth, **no es obligatorio** usar `(dashboard)`. Puedes tener solo:

- `app/layout.tsx` (con sidebar si quieres)
- `app/page.tsx` (home)
- `app/auth/...`

Y más adelante, si añades muchas rutas “de app” (clientes, envíos, etc.), puedes crear `app/(dashboard)/layout.tsx` y mover ahí ese layout con sidebar.

---

## 4. Dónde poner componentes

```
components/
├── ui/                  # Componentes de diseño reutilizables (shadcn, etc.)
│   ├── button.tsx
│   ├── card.tsx
│   ├── sidebar.tsx
│   └── ...
├── auth/                # Componentes usados solo en flujos de auth
│   ├── login-form.tsx
│   ├── sign-up-form.tsx
│   └── forgot-password-form.tsx
└── app-sidebar.tsx      # Componente específico de esta app (menú lateral)
```

- **`components/ui/`**: genéricos, sin lógica de negocio (botones, cards, inputs, sidebar base).
- **`components/auth/`**: formularios y piezas de las pantallas de auth.
- Componentes que representan **bloques de tu app** (por ejemplo el menú lateral con tus enlaces) pueden estar en `components/` con nombre claro: `app-sidebar.tsx`, `header.tsx`, etc.

---

## 5. Resumen para tu proyecto actual

- **Layout**: en **`app/layout.tsx`** (y opcionalmente en `app/(dashboard)/layout.tsx` si más adelante separas “área pública” de “área con sidebar”).
- **Página de inicio**: todo el contenido de la home en **`app/page.tsx`** (como ya está).
- **Auth**: mantener **`app/auth/`** con una carpeta por flujo (login, sign-up, forgot-password, etc.) y su `page.tsx` o `route.ts`.
- **Componentes**: **`components/ui/`** para shadcn y diseño, **`components/auth/**` para formularios de auth, y el resto de la app en **`components/`** con nombres descriptivos.

Con esto tienes una estructura clara y escalable sin complicar las URLs.
