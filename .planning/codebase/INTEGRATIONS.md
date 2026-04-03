# External Integrations

**Analysis Date:** 2026-04-03

## APIs & External Services

**Backend REST API (NestJS):**
- Service: Internal NestJS maintenance-report API
- Base URL: `process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api"`
- Client: Native `fetch` (no SDK/wrapper)
- Auth: Bearer JWT token passed in `Authorization` header
- Used from: `lib/admin-api.ts` (server-only helper), `lib/admin-server.ts` (SSR data fetching), `app/api/admin/*/route.ts` (proxy routes), `app/page.tsx` (public form, direct client-side fetch)

**Backend API Endpoints Consumed:**

| Endpoint | Method | Purpose | Called From |
|---|---|---|---|
| `/auth/login` | POST | Authenticate admin | `app/api/admin/login/route.ts` |
| `/maintenance-reports` | GET/POST | List/create work orders | `lib/admin-server.ts`, `app/page.tsx` |
| `/maintenance-reports/:code` | GET/PATCH | Single work order | `lib/admin-server.ts`, proxy routes |
| `/maintenance-reports/:code/status` | PATCH | Update work order status | `app/api/admin/reports/[reportCode]/status/route.ts` |
| `/maintenance-reports/:code` (assign) | PATCH | Assign technician | `app/api/admin/reports/[reportCode]/assign/route.ts` |
| `/maintenance-reports/:code` (notes) | POST | Add activity notes | `app/api/admin/reports/[reportCode]/notes/route.ts` |
| `/schedules/admin` | GET | Maintenance schedules | `lib/admin-server.ts` |
| `/schedules` | GET/POST/PATCH/DELETE | Schedule CRUD | `app/api/admin/schedules/route.ts`, proxy routes |
| `/audit/admin` | GET | Audit log entries | `lib/admin-server.ts` |
| `/analytics/admin/summary` | GET | KPI analytics summary | `lib/admin-server.ts` |
| `/alerts/admin/summary` | GET | Operational alerts | `lib/admin-server.ts` |
| `/alerts/acknowledge` | POST | Acknowledge/snooze alert | `app/api/admin/alerts/acknowledge/route.ts` |
| `/buildings` | GET/POST/PATCH/DELETE | Building CRUD | `app/api/admin/buildings/route.ts`, proxy routes |
| `/equipment` | GET/POST/PATCH/DELETE | Equipment CRUD | `app/api/admin/equipment/route.ts`, proxy routes |
| `/equipment/buildings` | GET | Equipment by building (public) | `app/page.tsx` |
| `/equipment/types` | GET | Equipment type list (public) | `app/page.tsx` |
| `/equipment/by-building` | GET | Filter equipment by building | `app/page.tsx` |
| `/equipment-types` | GET/POST/PATCH/DELETE | Equipment type CRUD | `app/api/admin/equipment-types/route.ts`, proxy routes |
| `/technicians` | GET/POST/PATCH/DELETE | Technician CRUD | `app/api/admin/technicians/route.ts`, proxy routes |
| `/users` | GET/POST/PATCH/DELETE | User management | `app/api/admin/users/route.ts`, proxy routes |
| `/checklists` | GET/POST/PATCH/DELETE | Checklist templates | `app/api/admin/checklists/route.ts`, proxy routes |
| `/checklists/template` | GET | Fetch checklist by equipment type | `app/page.tsx` |

**Google Fonts:**
- Service: Google Fonts CDN via `next/font/google`
- Font: Barlow (weights 400, 500, 600, 700)
- Used in: `app/layout.tsx`
- Method: Next.js font optimization (self-hosted at build time, no external requests at runtime)

## Data Storage

**Databases:**
- None — The frontend has no direct database connection. All persistence is handled by the backend NestJS service.

**File Storage:**
- None detected — Photo uploads in the public maintenance form (`app/page.tsx`) use `dataUrl` (base64 encoded) embedded in the JSON payload sent to the backend.

**Caching:**
- None — API routes use `cache: "no-store"` on all fetch calls. No Redis, Vercel KV, or in-memory cache layer.

## Authentication & Identity

**Auth Provider: Custom JWT (backend-issued)**
- Flow: Admin POSTs credentials to `POST /api/admin/login` → Next.js route proxies to backend `/auth/login` → backend returns `{ data: { accessToken: string } }` → token stored in HTTP-only cookie `yecl-admin-session`
- Cookie: `yecl-admin-session` — `httpOnly: true`, `sameSite: "lax"`, `secure` in production, `path: "/"`
- Roles: `admin`, `dispatcher`, `viewer` — decoded from JWT payload in `lib/admin-auth.ts`
- JWT decode: Client-side only (base64 split, no signature verification); expiry checked against `exp` claim
- Auth guard middleware: `proxy.ts` — intercepts all `/admin/:path*` routes; redirects unauthenticated requests to `/admin/login`
- Logout: `POST /api/admin/logout` clears the cookie by setting `maxAge: 0`
- Implementation files: `lib/admin-auth.ts`, `proxy.ts`, `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts`

**Public Form:**
- No authentication required for `app/page.tsx` (maintenance report submission form for technicians)

## Monitoring & Observability

**Error Tracking:**
- None — No Sentry, Datadog, or similar integration detected

**Logs:**
- None — No structured logging library; errors caught with try/catch and surfaced as UI state

## CI/CD & Deployment

**Hosting:**
- Not configured — `next.config.ts` has no `output: "export"` or platform-specific settings; compatible with Vercel (default) or Node.js server

**CI Pipeline:**
- None detected — No GitHub Actions, CircleCI, or similar workflow files found

## Environment Configuration

**Required env vars:**
- `API_BASE_URL` — Server-to-backend URL (preferred for SSR; not exposed to browser)
- `NEXT_PUBLIC_API_BASE_URL` — Client-to-backend URL (browser-accessible)
- `NODE_ENV` — `production` | `development`

**Optional env vars:**
- `NEXT_PUBLIC_ADMIN_EMAIL` — Seed value for login form email field (preview/demo only)
- `NEXT_PUBLIC_ADMIN_PASSWORD` — Seed value for login form password field (preview/demo only)
- `NEXT_PUBLIC_APP_URL` — App's public base URL

**Secrets location:**
- `env.local` file in project root (present; contents not read)
- No `.env.production` detected

## Webhooks & Callbacks

**Incoming:**
- None — No webhook receiver routes found

**Outgoing:**
- None — The app does not push events to external systems directly; all communication is request-response via fetch to the backend API

---

*Integration audit: 2026-04-03*
