# Super Admin — Project Brief

## Purpose

Platform-owner console for the multi-tenant e-commerce platform. Release 1 direction: Dashboard, cross-Store listing, Store detail, owner info, Store creation date, order count, sales totals, billing plan, billing/invoice history. Only the application shell and Dashboard placeholder exist today.

## Position in the System

```
Super Admin (this repo, frontend, port 4002)
    -> Admin privileged API (/api/super-admin/..., not yet built)
    -> Prisma -> PostgreSQL
```

- `ecommerce-admin-cwa` is the only backend, Prisma owner and system of record. Merchant Admin UI and StoreFront are separate.
- Super Admin has no database, Prisma, or `DATABASE_URL`, and does not duplicate Admin routes.
- Billing belongs to the Store (not the Clerk user). `StoreBillingProfile` exists in Admin; the billing-plan model is undecided. Invoices are manual in Release 1 — no Stripe subscriptions, cron or metering.

## Auth Architecture

1. Clerk (same application as Admin) signs the user in; `middleware.ts` requires a session on every route except `/sign-in`.
2. `(dashboard)/layout.tsx` compares the Clerk `userId` with `SUPER_ADMIN_CLERK_USER_ID`; anyone else sees "Access denied". Unset env = nobody is allowed.
3. `lib/admin-api.ts` calls Admin server-side with the Clerk session token as a Bearer token.
4. Admin must verify the token and the same user id on each privileged request (to be built in Admin). Steps 1–2 are UX gating only.

## Structure

- `app/(auth)` — sign-in only (no self sign-up UI).
- `app/(dashboard)` — gated shell (navbar, theme toggle, user menu) and Dashboard.
- `components/ui` — curated shadcn/Radix subset copied from Admin; add more only when needed.
- `lib/super-admin.ts` (UI gate), `lib/admin-api.ts` (only path to platform data).

## Environment

See `.env.example`: Clerk keys, `SUPER_ADMIN_CLERK_USER_ID`, `ADMIN_API_URL`.

## Deferred / Out of Scope

RBAC, teams, SuperAdmin table, billing-plan schema, automated billing, restaurant type, product reviews, order product-name/size/color snapshots. README-style tutorial docs are not authoritative.
