# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

UNAR (Unión de Árbitros) — internal system for managing referee designations, weekly payment liquidation, and debt collection for a sports referee association. Spanish-language domain (UI text, variable names, and DB columns are all in Spanish).

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint-config-next)
```

There is no test suite/runner configured in this repo.

Environment setup: copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Deploys automatically to Vercel on push to `main`.

## Architecture

**Stack**: Next.js 16 (App Router) + Tailwind CSS 4 + shadcn/ui (`base-nova` style, `neutral` base color, no prefix) + Supabase (Postgres, via `@supabase/ssr`).

### Data model

Source of truth is `supabase/schema.sql` (base schema) plus incremental files in `supabase/migrations/`. There is no migration runner — SQL is applied manually in the Supabase SQL editor (see README). `src/lib/types.ts` mirrors these tables by hand; when changing the schema, update both.

Core tables: `arbitros`, `ligas` (types: `principal` | `por_partido` | `inferiores` | `femenino`), `precios` (per-liga, per-role fee), `viaticos` (per-locality travel allowance), `designaciones` (a referee's assignment to a match/week, carries `monto_honorarios` + `monto_viatico` → `total`), `descuentos` (deductions applied to a referee for a given week), `deudas_pendientes` (persistent, cross-week debt balances — added in `20260322_add_deudas.sql`).

All money fields are integers (ARS, no decimals) — `formatARS()` in `src/lib/calculos.ts` formats with 0 fraction digits. RLS is enabled on every table with a single "allow all to `authenticated`" policy — this is a single-login internal tool, not multi-tenant.

### Week-based liquidation cycle

Everything is scoped by ISO week (`semana`) + `anio`, computed via `getSemanaInfo()` (date-fns `getISOWeek`/`getYear`) in `src/lib/calculos.ts`. The cycle is:

1. **Carga** (`/dashboard/carga-rapida`) — designaciones are entered per liga type, each liga type has its own form component in `src/components/carga/Formulario*.tsx` (Principal, PorPartido, Inferiores, Femenino), all driven by `FormularioDinamico`. Roles per liga come from `precios`; viático is optionally assigned to whichever referee "maneja" (drives).
2. **Resumen** (`/dashboard/resumen`) — pending designaciones/descuentos for the selected week are grouped per referee in `FilaArbitro` rows. Marking a referee paid updates `designaciones.pagado` per-row (not `estado`).
3. **Cerrar y Liquidar** (`handleCerrarSemana` in `src/app/dashboard/resumen/page.tsx`) — bulk-transitions the week's `designaciones.estado` → `pagado` and `descuentos.estado` → `liquidado`. Before that, it **auto-applies debt collection**: for each referee with a positive net amount this week, it walks their open `deudas_pendientes` rows, creates a `COBRO DEUDA:` `descuentos` row (pre-liquidated) for whatever the week can cover, and decrements `monto_actual`. This debt-collection loop must stay in sync with any change to how "neto disponible" is computed elsewhere (`FilaArbitro`'s `totalAPagar`).
4. **Historial** (`/dashboard/historial`) — read of already-closed (`estado = 'pagado'`/`'liquidado'`) weeks.

`FilaArbitro` (`src/components/resumen/FilaArbitro.tsx`) is shared between the internal resumen view and the public read-only view — a `readonly` prop disables all mutation controls (toggle paid, add/remove descuento, remove designación). Don't add a mutation path to this component without gating it behind `readonly`.

### Public sharing link

`/p/[id]` is an unauthenticated, read-only view of a single week's liquidation. `[id]` is `btoa("s{semana}-a{anio}")` — decoded client-side with `atob` + regex, not a real token/lookup. Treat it as an obscurity mechanism, not access control (RLS on `designaciones`/`descuentos`/`deudas_pendientes` reads is what actually needs to allow anon access, or the public page would fail — check RLS policies before assuming this page works standalone).

### Auth

`src/middleware.ts` gates all `/dashboard/**` routes via Supabase session cookie, redirects unauthenticated users to `/login`, and redirects authenticated users away from `/login` and `/` into `/dashboard`. Two Supabase client factories: `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (SSR/server components, cookie-based). Most data fetching in this app actually happens client-side via `createClient()` from `client.ts` inside `"use client"` pages, not through server components.

### Branding

Centralized in `src/lib/brand.ts` (name, long name, logo path, primary color) and mirrored as CSS variables `--color-brand` / `--color-brand-hover` in `src/app/globals.css`. Components reference `bg-brand`, `text-brand`, `hover:bg-brand-hover` Tailwind utilities rather than hardcoded colors — keep new UI consistent with this instead of introducing new color literals.
