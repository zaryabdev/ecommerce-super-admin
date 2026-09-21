# AGENTS.md — Super Admin Repository

## Role

Third frontend of the e-commerce platform, for the platform owner (one designated Super Admin). It is a **frontend only**. Read `docs/PROJECT_BRIEF.md` and `Todo.md` before changing anything. If docs conflict with source, source wins.

## Stack

Next.js 13.4.5 App Router, React 18.2, TypeScript 5.1.3, Tailwind 3.3.2, shadcn/Radix, Clerk (`@clerk/nextjs` 4.x). Versions intentionally match `ecommerce-admin-cwa`.

## Hard Boundaries

Do not add to this repo: Prisma, `DATABASE_URL`, any database driver, API route handlers that hold business logic, a SuperAdmin table, RBAC/permission engine/teams, or its own password/auth backend.

All platform data comes from Admin's privileged API namespace (`/api/super-admin/...`) through `lib/admin-api.ts`. Data path: Super Admin → Admin API → Prisma → PostgreSQL. Admin is the only backend and system of record.

## Authorization

- Clerk (same Clerk application as Admin) authenticates; `SUPER_ADMIN_CLERK_USER_ID` identifies the one Super Admin.
- `app/(dashboard)/layout.tsx` + `lib/super-admin.ts` only gate the UI (fail closed if unset). This is not a security boundary.
- Authoritative authorization is server-side in Admin's privileged API (not yet built). Being a merchant Admin user must never grant access.

## Change Discipline

- Inspect before editing; smallest coherent change; no opportunistic refactors or dependency upgrades.
- Copy UI components from Admin only when needed (`components/ui` is a curated subset).
- Do not modify Admin from here; list needed Admin API work in `Todo.md` and coordinate first.
- Release 1 billing is manual: no Stripe subscriptions, cron, usage metering or billing workers. Billing-plan schema is not yet decided — do not invent it.
- No browser automation; manual browser testing is done by the project owner.
- Do not commit unless asked.

## Commands

`npm run dev` (port 4002), `npm run build`, `npm run lint`, `npx tsc --noEmit`. Build needs Clerk keys in `.env.local` (see `.env.example`).

Cross-repo canonical context lives in `ecommerce_ai_context` (`PROJECT_BRIEF.md`, `projects/super-admin/CONTEXT.md`, `decisions/DECISIONS.md`).
