# Super Admin Chat Resume

## Goal

Build `D:\Work\ecommerce-super-admin` as a separate platform-level Super Admin application. Intended capabilities are explicit platform authorization, all-store/tenant visibility, permitted order/sales drill-down, monthly invoice generation/tracking, invoice delivery, and future platform administration. No Super Admin functionality was implemented during discovery.

## Repository Map

- `ecommerce-admin-cwa` — Next.js 13.4.5 merchant Admin/CMS and PostgreSQL/Prisma system of record/API; inspected on `dev` at `4cb9889`; `.vscode/settings.json` was clean initially but modified by the final read-only check and was preserved.
- `ecommerce-store-cwa` — Next.js 13.4.4 customer Storefront consuming Admin HTTP APIs; inspected on `dev` at `a5016c0`; `.vscode/settings.json` was already modified and was preserved.
- `ecommerce-super-admin` — empty new repository on `main`, no commits/valid HEAD, only `.git` and a remote; this is allowed and is the implementation target.

## Verified Current Architecture

Admin owns PostgreSQL/Prisma, stores, catalog, orders, inventory transitions, and route handlers. Storefront has no DB, auth, payment SDK, local API, or persistence beyond a browser Zustand/localStorage cart. Storefront calls Admin public catalog routes and public COD creation. Cloudinary stores image files/URLs; Resend sends one best-effort merchant new-order notification. Stripe checkout/webhooks are removed from current source despite stale enum/docs/history.

Admin’s current schema includes Store, Billboard, hierarchical Category, Product (mutable Decimal price and current quantity), Order, OrderItem (quantity), Size, Color, and Image. Product is one fixed size/color row, not a variant matrix. Current Admin migrations include COD default, homepage billboard, category hierarchy, and quantities.

## Clerk

Only Admin uses Clerk (`@clerk/nextjs` 4.21.3): ClerkProvider, auth middleware, SignIn/SignUp, `auth()`, UserButton, and Clerk user lookup for merchant email. A Store stores the Clerk `userId`; one user can own multiple stores. No Organizations, roles, permissions, metadata, custom claims, or platform identity is present. Storefront and Super Admin have no Clerk setup. Reusing the production Clerk ecosystem is plausible but not verified; platform authorization must be explicit and server-validated.

## Store / Tenant Model

Store is the tenant root with UUID `id` and owner string `userId`. Catalog/order children carry `storeId`; there are no memberships or billing fields. Storefront is one store per deployment via `NEXT_PUBLIC_STORE_ID` and store-scoped `NEXT_PUBLIC_API_URL`. Merchant dashboard and most writes enforce `Store.id + Clerk userId`. Child mutation predicates and same-store foreign-key checks are incomplete; do not rely on current routes for platform cross-store access.

## Backend Ownership

Admin is the only verified database/business-logic/API owner. Super Admin should not connect directly to Prisma from a browser. Add a trusted, explicitly authorized platform API/service (initially possibly alongside Admin) for store lists, aggregates, drill-down, invoices, and email operations. No extra backend/worker/scheduler exists under `D:\Work`.

## Admin <-> Storefront Contract

Storefront reads branding from unscoped `GET /api/stores/{storeId}` using `NEXT_PUBLIC_API_BASE_URL`. It reads homepage billboard, categories, products, sizes, and colors from store-scoped endpoints under `NEXT_PUBLIC_API_URL`. Product filtering supports category/color/size/featured and optional immediate child categories. Public child reads are often ID-only. The live checkout is `POST /api/{storeId}/cod` with:

```json
{
  "items": [{"productId": "...", "quantity": 1}],
  "paymentMethod": "COD",
  "customer": {"name": "...", "phone": "...", "email": "..."},
  "shipping": {"line1": "...", "city": "...", "country": "PK"}
}
```

Admin re-prices from DB, validates store/archive/stock, creates a DRAFT COD order, returns tracking/product/customer data, and Storefront renders the response. Admin confirms/cancels orders through an authenticated owner route and transactionally changes stock. There is no public order-status API for customers.

## Sales

OrderItem quantity is now persisted, but no immutable unit-price/line-total/order-total snapshot exists. `getTotalRevenue` and `getGraphRevenue` use mutable current product prices and omit quantity multiplication; the order list display does multiply quantity. COD orders remain `isPaid=false`, and no current code marks orders paid. Currency is not stored; formatting/defaults are PKR/`en-PK`. Taxes, discounts, shipping fees, refunds, payment transactions, and platform revenue are absent. Cross-store metrics are technically derivable server-side but not currently exposed or reliable as accounting.

## Billing / Invoices

No invoice, billing, commission, subscription, fee, PDF, numbering, due date, payment link, invoice status, scheduler, worker, retry, or audit implementation exists. The Admin “Billing” menu item is static. Invoice basis and accounting rules must be decided before schema/API work.

## Email

Admin’s only email path is Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optional test recipient) for new COD order notifications to the Store owner’s Clerk email. It uses inline HTML/plain text and catches failures after order creation. No invoice template/PDF attachment, delivery webhook, retry/idempotency, message log, or audit trail exists. Reuse Resend only in a trusted platform mail workflow after adding those controls.

## Super Admin Repo Current State

Empty and safe to continue in; no framework, dependencies, routes, components, Clerk setup, or unsafe scaffolding exists. The first phase can establish a compatible Next.js app and server/client boundaries.

## Security Constraints

- Authentication is not platform authorization.
- Do not expose cross-store data until a server-validated platform role/claim or mapping exists.
- Do not bypass merchant ownership checks globally or reuse public catalog routes for platform work.
- Harden child-ID mutations and same-store foreign relationships before relying on them.
- Treat current sales as provisional until immutable pricing, quantity-aware aggregates, currency, settlement, refund, tax, discount, and status semantics are defined.
- Minimize customer PII, paginate drill-down, and add audit logging for platform actions.
- COD is public and CORS `*`; it has validation but no customer auth/rate-limit/idempotency evidence.

## Confirmed Decisions

- Admin remains the current system of record and Storefront API owner.
- Storefront remains a customer frontend, not a second backend.
- Super Admin is a separate application, not a merchant-dashboard route.
- No application code was changed during discovery.
- Current source supersedes stale tutorial/context claims.
- First safe work is Super Admin scaffolding plus authorization/API design, not invoices or direct DB access.

## Open Decisions

Platform-admin provisioning and revocation; shared versus separate Clerk app; location of trusted platform API; definition of a sale/paid COD; currency, tax, discount, shipping, commission, refund, period/time-zone rules; immutable historical-price strategy; invoice numbering/due dates/status/payment; PDF storage; recipients and PII/audit/retention; manual versus scheduled Release 1 generation.

## Important Files

- Admin: `prisma/schema.prisma`; `app/api/[storeId]/cod/route.ts`; `app/api/[storeId]/orders/[orderId]/route.ts`; `actions/get-total-revenue.ts`; `actions/get-graph-revenue.ts`; `actions/get-sales-count.ts`; `app/(dashboard)/[storeId]/(routes)/orders/page.tsx`; `middleware.ts`; `app/(dashboard)/[storeId]/layout.tsx`; `lib/email/send-new-order-notification.ts`; `Todo.md`.
- Storefront: `types.ts`; `hooks/use-cart.tsx`; `app/(routes)/cart/components/summary.tsx`; `cod-details-form.tsx`; `actions/get-store.tsx`; `get-homepage-billboard.tsx`; `get-products.tsx`; `AGENTS.md`; `docs/PROJECT_BRIEF.md`.
- Historical context: `ecommerce-admin-cwa/SUPER_ADMIN_DISCOVERY.md` (partially stale Admin-only report; unchanged).

## Next Step

Review this discovery, decide the platform authorization and accounting/billing rules, then scaffold `ecommerce-super-admin` with Clerk middleware and a server-only platform API client. Implement no cross-store query until the trusted platform API contract and authorization tests are approved.
