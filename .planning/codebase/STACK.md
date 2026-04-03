# Technology Stack

**Analysis Date:** 2026-04-03

## Languages

**Primary:**
- TypeScript 5.x - All source files (`*.ts`, `*.tsx`); strict mode enabled

**Secondary:**
- JavaScript - Allowed via `allowJs: true` (tsconfig); used for config files (`eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts`)

## Runtime

**Environment:**
- Node.js — dev machine running v25.8.0; no `.nvmrc` or `.node-version` file present

**Package Manager:**
- pnpm — lockfileVersion 9.0
- Lockfile: `pnpm-lock.yaml` (committed)

## Frameworks

**Core:**
- Next.js 16.2.2 — Full-stack React framework using App Router; handles routing, server components, API routes, and middleware
- React 19.2.4 — UI rendering (RSC + client components)

**Styling:**
- TailwindCSS 4.x — Utility-first CSS via `@tailwindcss/postcss` plugin; configured in `postcss.config.mjs`
- CSS custom properties defined in `app/globals.css` (`--background`, `--foreground`, `--font-sans`)

**Forms & Validation:**
- react-hook-form 7.72.0 — Form state management (used on public maintenance report form in `app/page.tsx`)
- @hookform/resolvers 5.2.2 — Adapter connecting react-hook-form to Zod schemas
- Zod 4.3.6 — Runtime schema validation and type inference

**Build/Dev:**
- Next.js built-in compiler — No separate Webpack/Vite config
- TypeScript compiler — `noEmit: true`; Next.js plugin in `tsconfig.json`
- PostCSS — `postcss.config.mjs` with `@tailwindcss/postcss`
- ESLint 9 + `eslint-config-next` 16.2.2 — Linting with `next/core-web-vitals` and `next/typescript` rulesets; config in `eslint.config.mjs`

## Key Dependencies

**Critical:**
- `next` 16.2.2 — App Router, server components, API routes, middleware, `next/font/google`
- `react` + `react-dom` 19.2.4 — React 19 (supports `use client`/`use server` directives)
- `zod` 4.3.6 — Input validation across forms and API boundaries

**Infrastructure:**
- `@hookform/resolvers` 5.2.2 — Bridges form state to Zod validation
- `react-hook-form` 7.72.0 — Manages the multi-step public technician form

## Configuration

**TypeScript:**
- Target: `ES2017`
- Module resolution: `bundler`
- Strict mode: enabled
- Path alias: `@/*` → `./` (project root)
- Config: `tsconfig.json`

**Environment:**
- `API_BASE_URL` — Server-side backend base URL (SSR/API routes); fallback to `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL` — Client-side backend base URL; default `http://localhost:3001/api`
- `NEXT_PUBLIC_ADMIN_EMAIL` — Preview login email; default `ops@yomaelevator.com`
- `NEXT_PUBLIC_ADMIN_PASSWORD` — Preview login password; default `preview-access`
- `NEXT_PUBLIC_APP_URL` — Public URL of the app
- `NODE_ENV` — Standard Node environment mode
- `.env` files: `env.local` is present (name without leading dot); no `.env`, `.env.local`, `.env.production` detected

**Build:**
- `next.config.ts` — Minimal; no custom rewrites, redirects, or image domains configured
- `postcss.config.mjs` — TailwindCSS PostCSS plugin only

## Platform Requirements

**Development:**
- Node.js (version underpinned; `pnpm` required)
- Backend API running at `http://localhost:3001/api`

**Production:**
- Deployment target: Not explicitly configured in `next.config.ts`; compatible with Vercel or any Node.js server

---

*Stack analysis: 2026-04-03*
