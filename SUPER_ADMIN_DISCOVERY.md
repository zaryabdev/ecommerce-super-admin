# Super Admin Cross-Repository Discovery

**Investigation date:** 2026-09-19  
**Source branches:** `dev` for Admin and Storefront; the newly created Super Admin repository is documented on its actual `main` branch with no commit.  
**Method:** read-only inspection of the three repositories under `D:\Work`; current source and checked-in migrations are authoritative. No application code, dependencies, Git history, branches, environment files, or database data were changed.

## 1. Executive Summary

`ecommerce-admin-cwa` is currently a combined authenticated merchant Admin/CMS, PostgreSQL/Prisma system of record, and public REST API. It owns stores, catalog, orders, inventory, and the current COD order flow. `ecommerce-store-cwa` is a customer-facing Next.js storefront with no database, authentication, payment SDK, or local API. It consumes the Admin API over unauthenticated HTTP and is configured as one store per deployment. `ecommerce-super-admin` is empty: it has a Git repository and remote but no application files, package manifest, commit, or implementation.

The current Admin source is materially newer than the previous Admin-only discovery. It now has product and order-item quantities, category hierarchy, a homepage billboard relation/endpoint, store-scoped product validation in COD, authenticated order-status transitions, and transactional stock decrement/restore. Conversely, Stripe checkout/webhook code has been removed; the current package has no Stripe dependency or route. Existing Admin and Storefront context documents still contain several pre-change Stripe, billboard, migration, and quantity statements and are therefore partially stale.

The existing database is sufficient to start a Super Admin application scaffold and an explicit platform-authorization/API design. It is not sufficient to treat current sales as an accounting ledger: order totals and immutable unit prices are not stored, currency/tax/discount/refund data is absent, dashboard revenue ignores `OrderItem.quantity`, and normal order creation is COD with `isPaid=false`. No platform role, cross-store API, invoice model, PDF pipeline, scheduler, delivery tracking, or billing data exists.

**Readiness conclusion:** **YES — sufficient technical context to begin**, with the first safe phase limited to Super Admin scaffolding, Clerk/platform-authorization design, and a versioned trusted platform API contract. Cross-store reporting and invoices must wait for the explicit authorization, accounting, and billing decisions listed below.

## 2. Investigation Scope

Inspected actual source, package manifests, route handlers, Prisma schema and migrations, Clerk usage, catalog/order flows, Storefront API clients, email/payment/billing searches, repository documentation, Git status/history, and the current Super Admin repository. Searches covered all tracked source and Markdown files while excluding dependency directories. No `.env*` files are present in any repository; only variable names documented or referenced by source are recorded here.

The survey does not inspect production Clerk configuration, production database rows, deployment dashboards, Resend account state, Cloudinary account state, or services outside `D:\Work`. Those remain explicitly unknown.

### Durable documentation status

| Document | Status | Reason |
|---|---|---|
| Admin `AGENTS.md` | PARTIALLY STALE | Current repository role and safety rules are useful, but its known-risk list still says order-status auth, broken billboard GETs, and no OrderItem quantity. |
| Admin `CLAUDE.md` | PARTIALLY STALE | Current role/tenant rules remain useful; the no-quantity and unauthenticated-order-status statements conflict with current source. |
| Admin `docs/PROJECT_BRIEF.md` | PARTIALLY STALE | Strong source-oriented architecture context, but Stripe/current migration/known-risk portions predate current `dev` changes. |
| Admin `Todo.md` | CURRENT ROADMAP / PARTIALLY STALE DETAILS | Quantity checklist reflects completed work and Super Admin remains future work; some prose is historical and still assumes the pre-quantity model. |
| Admin `README.md` | STALE | Original tutorial documentation describes MySQL/PlanetScale and tutorial-era payment/features rather than current PostgreSQL/COD source. |
| Admin `SUPER_ADMIN_DISCOVERY.md` | PARTIALLY STALE | Previous Admin-only report is valuable historical context but conflicts with current quantity, status-auth, billboard, migration, and Storefront facts; it was not modified. |
| Storefront `AGENTS.md` | PARTIALLY STALE | Current API/env and responsibility rules are useful, but its no-quantity guidance is superseded by source. |
| Storefront `CLAUDE.md` | PARTIALLY STALE | Current Storefront boundary/COD guidance is useful; old no-quantity and billboard assumptions are not current source. |
| Storefront `docs/PROJECT_BRIEF.md` | PARTIALLY STALE | Good reverse-engineered frontend map, but its Stripe/no-quantity/old billboard sections predate current source. |
| Storefront `README.md` | STALE | Tutorial README describes Admin/Clerk/MySQL-era capabilities and omits the current API-specific reality. |
| Super Admin durable docs | UNKNOWN / NOT PRESENT before this survey | Repository had no application or Markdown files; the two authoritative documents were created by this survey. |

## 3. Git Branch / Commit Verification

The required state is now interpreted correctly: Admin and Storefront are inspected on their existing `dev` branches; the new Super Admin repository may remain on `main` without a commit. No branch was switched and no Git history was modified.

| Repository | Actual branch | HEAD | Working tree |
|---|---|---|---|
| `D:\Work\ecommerce-admin-cwa` | `dev` | `4cb98898b9e80f2f2315ccd40550c9d784286401` (`4cb9889`) | Initial check clean; final check dirty: `.vscode/settings.json` modified (commented settings), preserved unchanged |
| `D:\Work\ecommerce-store-cwa` | `dev` | `a5016c053cdf385eb3f5e47f224b1dad63cc8190` (`a5016c0`) | Dirty: `.vscode/settings.json` modified; preserved unchanged |
| `D:\Work\ecommerce-super-admin` | `main` | No valid `HEAD`; repository reports “No commits yet on main” | No application files or tracked changes observed |

The Super Admin remote is `https://github.com/zaryabdev/ecommerce-super-admin.git`; its `origin/main` reference is gone. The workspace contains no fourth application/backend repository. The Admin `.vscode/settings.json` modification appeared by the final read-only check after the initial verification; no intentional edit/revert/stash/commit was performed by this survey. Both repository-local editor modifications were left intact.

## 4. Workspace Repository Map

| Repository | Verified responsibility | Framework/runtime | Package manager | Persistence/API | Auth |
|---|---|---|---|---|---|
| Admin | Merchant dashboard, CMS, system of record, public/store-scoped API | Next.js 13.4.5 App Router, React 18.2, TypeScript 5.1.3 | npm (`package-lock.json`) | Prisma 4.16/PostgreSQL; Next route handlers | Clerk `@clerk/nextjs` 4.21.3 |
| Storefront | Customer catalog, cart, COD checkout UI | Next.js 13.4.4 App Router, React 18.2, TypeScript 5.1.3 | npm (`package-lock.json`) | No local DB or API routes; fetch/axios to Admin | None |
| Super Admin | Intended platform-level application; currently unimplemented | None yet | None yet | None | None |

Admin uses Tailwind 3.3, shadcn/Radix primitives, React Hook Form/Zod, Zustand, TanStack Table, Recharts, Axios, Cloudinary, and Resend. Storefront uses Tailwind, hand-rolled UI plus Headless UI, Zustand persist, native `fetch`, Axios, `query-string`, and `react-hot-toast`. Neither application has a test runner, test script, or separate typecheck script; both expose `dev`, `build`, `start`, and `lint` (Admin also runs `prisma generate` in `postinstall`).

## 5. ecommerce-admin-cwa Current Architecture

### Application and routing

- `app/layout.tsx` mounts `ClerkProvider`, theme, toast, and modal providers.
- `(auth)` renders Clerk `<SignIn />` and `<SignUp />`.
- `(root)` is the authenticated no-store bootstrap route; it redirects to `/sign-in` when unauthenticated and opens store creation UI for a user without a store.
- `(dashboard)/[storeId]` is the merchant dashboard. Its layout calls `auth()` and verifies `Store.id + userId` before rendering the navbar and child pages.
- Dashboard pages are primarily Server Components querying Prisma directly. Interactive forms, tables, and modals are Client Components that call route handlers with Axios.
- `actions/*.ts` are ordinary Prisma aggregation helpers, not Next Server Actions; no `"use server"` code was found.
- `middleware.ts` uses Clerk `authMiddleware` and marks `/api/:path*` public at middleware level. API handlers must perform their own auth when a route is protected.

### Catalog and UI

The merchant manages stores, billboards, categories, sizes, colors, products, settings, and orders. Catalog pages follow a repeated Server Component -> client table/form -> route handler pattern. Cloudinary URLs are persisted in `Image.url`; PostgreSQL does not store image binaries. The upload widget is `components/ui/image-upload.tsx` and uses `next-cloudinary` with a hard-coded upload preset.

The current model is not a variant matrix. A `Product` has one category, one size, one color, price, quantity, featured/archive flags, and images. Category hierarchy is two-level in route validation: a child can point to a top-level parent, and top-level categories can opt into immediate children in the product GET filter.

### Current environment conventions (names only)

Source/docs identify Clerk publishable/secret and sign-in redirect variables, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and optional `RESEND_TEST_RECIPIENT`. The source does not contain actual values and no environment file is committed. `DATABASE_URL` is the pooled Prisma URL; `DATABASE_URL_UNPOOLED` is the direct migration URL (`prisma/schema.prisma`).

## 6. ecommerce-store-cwa Current Architecture

The Storefront is a customer-facing, single-store-per-deployment frontend. It has no Clerk package or provider, no local database, no local API route handler, no Stripe SDK, and no server-side persistence. Home, category, and product pages are dynamic Server Components (`revalidate = 0`) that call small `actions/get-*.tsx` fetch wrappers. Interactive cart, filters, modals, and checkout are Client Components.

The deployment is configured through public variables:

- `NEXT_PUBLIC_STORE_ID` identifies the Admin `Store.id` for branding and the home billboard request.
- `NEXT_PUBLIC_API_URL` is expected to be the store-scoped Admin base (for example `/api/{storeId}`) used by catalog and COD calls.
- `NEXT_PUBLIC_API_BASE_URL` is the unscoped Admin API root used only by `get-store.tsx` for `/stores/{storeId}`.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` controls the optional floating WhatsApp link.

This split is real source behavior, not merely documentation. Most read helpers do not check `res.ok` or validate JSON; `get-store` and `get-homepage-billboard` do. The Storefront has no customer account or order-status API; it displays the COD response immediately in `OrderSuccessCard`.

The cart in `hooks/use-cart.tsx` is persisted in browser localStorage under `cart-storage`. Current items are `{ product, quantity }`; quantities are clamped against the product's current available quantity. Product detail and cart controls support increment/decrement. This supersedes the older “one product object/no quantity” documentation.

## 7. ecommerce-super-admin Current State

The directory contains only `.git`. It has no `package.json`, lockfile, `app/`, `src/`, route, component, Clerk setup, API client, database access, environment template, README, AGENTS/CLAUDE instructions, or discovery/resume file. It is therefore classified as **E. Empty/not yet implemented**. There is nothing to preserve or remove, and no compatibility decision can be made from existing code. A new Next.js App Router application would be compatible with the existing ecosystem, but the framework/version is an implementation decision rather than an existing fact.

## 8. End-to-End Platform Architecture

```text
Clerk (currently used only by Admin)
        |
        v
Merchant Admin / CMS (ecommerce-admin-cwa)
        |  Prisma Client / route handlers
        v
PostgreSQL (authoritative current database)
        ^
        | public catalog + COD HTTP API
Customer Storefront (ecommerce-store-cwa)

Cloudinary -> product/store image URLs used by Admin and Storefront
Resend -> best-effort merchant new-order notification from Admin
Stripe -> removed from current source; no live route/SDK found

Future Super Admin -> trusted, explicitly authorized platform API/backend
                         (not browser-direct Prisma)
```

Verified ownership is concentrated in Admin: it owns the database schema, Prisma access, order creation, inventory transitions, and current API. The Storefront owns presentation, browser cart state, customer form collection, and HTTP calls. The future Super Admin should own platform UI/orchestration, while a trusted backend/platform layer should own cross-store authorization, aggregates, invoice state/calculation, document generation, and delivery audit. Whether that trusted layer is added beside Admin or extracted later is an open implementation decision; no additional backend exists in this workspace.

## 9. Clerk Authentication Architecture

### Verified from source

- Admin uses `@clerk/nextjs` `^4.21.3`, `ClerkProvider`, `authMiddleware`, `<SignIn />`, `<SignUp />`, `auth()`, `UserButton`, and `clerkClient.users.getUser()` for merchant email lookup.
- Admin stores the Clerk `userId` string directly in `Store.userId`; there is no local User table.
- Store creation sets `userId` from the authenticated Clerk session. Dashboard/layout/navbar/settings and protected mutation handlers use the current `userId`.
- One Clerk user can own multiple Store rows; the store switcher queries all rows with `where: { userId }`.
- Storefront has no Clerk package, session, customer authentication, or identity mapping. Customer fields are copied into COD `Order` columns.
- Super Admin has no auth implementation.
- No source usage of Clerk Organizations, roles, permissions, public/private/unsafe metadata, custom claims, or Clerk webhooks exists in any repository.

### Likely but not verified

The future application could reuse the same Clerk instance/application and existing merchant sign-in ecosystem, but source cannot prove production Clerk tenancy, domains, redirect configuration, or whether a separate Clerk application is intended.

### Unknown

There is no verified platform-admin identity, provisioning/revocation process, MFA policy, claim schema, or production account ownership. Successful Clerk authentication alone must not grant cross-store access.

## 10. Authorization Model

Merchant writes generally use this pattern: call `auth()`, reject missing `userId`, verify `Store.id + userId`, then mutate store-scoped data. Public catalog GETs and public COD creation are intentional because the Storefront has no merchant session. The middleware-level public API exception makes route-level enforcement mandatory.

The order-status route now calls `auth()`, verifies the requested store belongs to the caller, fetches the order by both `id` and `storeId`, validates an explicit transition matrix, and performs conditional transactional stock changes. Its old unauthenticated behavior in the previous report is no longer current.

Authorization remains decentralized and incomplete. Billboard, product, size, and color child mutations verify ownership of the path store but then update/delete by child ID alone. Public child GETs for product/category/size/color are also commonly keyed by child ID without a store predicate. Request-body foreign IDs (for example product category/size/color) are not generally checked for same-store ownership. These are concrete IDOR/integrity risks for future platform integration, even where ordinary UI paths usually supply same-store IDs.

## 11. Store / Tenant Model

`Store` is the tenant root (`id` UUID, `name`, `userId`, optional `logoUrl`, optional `homepageBillboardId`, timestamps). It has one owner Clerk user and relations to Billboards, Categories, Products, Orders, Sizes, and Colors. No membership table, multi-user store role, subscription, billing address, currency, or platform account exists.

`Billboard`, `Category`, `Product`, `Size`, `Color`, and `Order` carry `storeId` foreign keys and indexes. `OrderItem` carries `orderId` and `productId` but not `storeId`. `Image` carries `productId`. PostgreSQL foreign keys are mostly `RESTRICT`; images cascade on product deletion. The schema does not enforce that a Product's category/size/color belongs to the same Store or that an OrderItem's Product belongs to the Order's Store.

The Storefront is single-tenant per deployment: `NEXT_PUBLIC_STORE_ID` and a store-scoped `NEXT_PUBLIC_API_URL` select the tenant. Public API path IDs and Storefront environment configuration are the primary resolution mechanisms; there is no slug/subdomain resolver.

## 12. Admin <-> Storefront API Contracts

The Storefront does not send Clerk credentials or an API key. Relative paths below are against `NEXT_PUBLIC_API_URL` unless marked unscoped.

| Storefront source | Method/endpoint | Payload/query | Response/use | Admin source / auth |
|---|---|---|---|---|
| `components/navbar.tsx` -> `actions/get-store.tsx` | `GET {API_BASE_URL}/stores/{storeId}` | none | `{ id, name, logoUrl }` branding | `app/api/stores/[storeId]/route.ts`, public |
| `app/(routes)/page.tsx` -> `get-homepage-billboard.tsx` | `GET /homepage-billboard` | none | Billboard or `null` | `app/api/[storeId]/homepage-billboard/route.ts`, public |
| navbar/category pages -> `get-categories.tsx` | `GET /categories` | none | Category rows (`id,name,parentId,billboardId`) | `.../categories/route.ts`, public |
| category page -> `get-category.tsx` | `GET /categories/{id}` | none | One category with billboard | `.../categories/[categoryId]/route.ts`, public; query is by child ID only |
| category page -> `get-sizes.tsx` / `get-colors.tsx` | `GET /sizes`, `GET /colors` | none | Store-scoped filter rows | corresponding collection routes, public |
| product/category/home -> `get-products.tsx` | `GET /products` | `categoryId`, `colorId`, `sizeId`, `isFeatured`, optional `includeChildCategories=true` | Non-archived products with images/category/color/size and quantity | `.../products/route.ts`, public; collection has `storeId` predicate |
| product page -> `get-product.tsx` | `GET /products/{id}` | none | Product with related records | `.../products/[productId]/route.ts`, public; child query is ID-only |
| `summary.tsx` -> `submitCOD` | `POST /cod` | `{ items:[{productId,quantity}], paymentMethod:"COD", customer:{name,phone,email?}, shipping:{line1,line2?,city,postalCode?,country?,notes?}, notes? }` | `orderId`, `trackingId`, status, payment method, customer/shipping fields, products with quantity/size/color, totalPrice, store `{id,name}` | `.../cod/route.ts`, public, `Access-Control-Allow-Origin: *`; products constrained to `params.storeId` |
| Admin order UI -> order route | `PATCH /orders/{orderId}` | `{ status: "CONFIRMED"|"DELIVERED"|"CANCELED" }` | Updated Order or conflict/stock error | `.../orders/[orderId]/route.ts`, Clerk + store-owner check |

There is no public billboard collection GET (the collection handler is commented out), although billboard child GET is implemented and correctly checks both `billboardId` and `storeId`. There is no public order GET/list route; the Admin orders page reads Prisma directly. No cross-store reporting endpoint exists.

## 13. Product / Catalog Flow

Admin forms validate client-side with React Hook Form/Zod and route handlers repeat basic manual checks. Product creation/update requires name, price, nonnegative integer quantity, categoryId, colorId, sizeId, and at least one image; Admin re-fetches related catalog data when serving public GETs. Storefront renders fixed size/color products, uses `quantity` to show stock, clamps cart quantities, and filters via URL query parameters.

The current API supports category hierarchy through `parentId` and `includeChildCategories=true` for top-level category product queries. Category API rules require a billboard for top-level categories and restrict parents to top-level categories. The Storefront category page reconstructs parent/child navigation from the flat category list.

Representative flow:

```text
Storefront home/category/product Server Component
  -> actions/get-*.tsx fetch
  -> GET /api/{storeId}/products|categories|sizes|colors|homepage-billboard
  -> Admin route handler
  -> Prisma findMany/findUnique with store-scoped collection predicates
  -> PostgreSQL rows returned as JSON
```

## 14. Checkout / Order Creation Flow

The live checkout flow is COD only:

```text
ProductCard / Info
  -> useCart.addItem(product, quantity)
  -> persisted Zustand/localStorage cart `{ product, quantity }`
  -> /cart Summary + CODDetailsForm
  -> axios POST `${NEXT_PUBLIC_API_URL}/cod`
  -> Admin validates positive item quantities and finds products by `{ id in productIds, storeId: params.storeId }`
  -> rejects archived, missing, or insufficient-stock items
  -> recalculates total from authoritative Product.price * requested quantity
  -> creates DRAFT COD Order + OrderItem quantity rows + server tracking ID
  -> best-effort Resend notification to Store owner's Clerk email
  -> returns order/tracking/product/customer data
  -> Storefront clears cart and renders OrderSuccessCard
```

The Admin route does not decrement stock at creation. `PATCH /orders/{orderId}` confirms a DRAFT (or re-confirms a canceled order) inside a transaction, conditionally decrementing Product.quantity; confirmed cancellation restores quantities. Status transitions are `DRAFT -> CONFIRMED/CANCELED`, `CONFIRMED -> DELIVERED/CANCELED`, and `CANCELED -> CONFIRMED`; DELIVERED is terminal. There is no inventory event/audit table.

The Storefront form hard-codes `country: "PK"`; it requires name, phone, address line 1, and city but treats email/postal code as optional. No customer account, shipping carrier, tax, discount, or shipping-fee flow exists.

## 15. Payments / COD / Stripe State

Current source has no Stripe dependency, `lib/stripe.ts`, `/checkout` route, `/webhook` route, Stripe environment reference, or Stripe call. Git history includes the removal commit (`947cc38 removed stripe from the repo` in Admin and `d339294 removed stripe from the repo` in Storefront). The Prisma `PaymentMethod` enum still contains `STRIPE`, and older docs/README text still describes Stripe; these are historical artifacts, not a verified live path.

COD orders are created with `paymentMethod=COD`, `status=DRAFT`, and `isPaid=false`. No current route sets `isPaid=true`, including order-status transitions. Therefore “paid orders” are a data field/query convention, not a functioning COD settlement process. Payment provider transaction IDs, capture timestamps, refunds, chargebacks, and payment events are absent.

## 16. Sales Data Model

Authoritative current fields are:

- `Order.storeId`, `status`, `paymentMethod`, `trackingId`, `isPaid`, customer/shipping fields, timestamps.
- `OrderItem.orderId`, `productId`, and `quantity` (added by `20260918104913_add_product_and_orderitem_quantity`).
- `Product.price` (mutable Decimal), current `quantity`, category/size/color, archive/featured flags.

Not stored: order total, immutable unit price, immutable line total, currency, tax, discount, shipping charge, refund, payment transaction, settlement time, invoice relation, or accounting adjustment. The COD route computes a response/email total only. The Admin order table reconstructs a display total as current `product.price * OrderItem.quantity`.

The `OrderItem.quantity` snapshot preserves purchased quantity even when current inventory changes. It does **not** preserve historical price. Changing a Product price changes reconstructed historical totals. `getTotalRevenue` and `getGraphRevenue` additionally sum each item’s current price without multiplying by `OrderItem.quantity`, so their current dashboard revenue can undercount multi-unit orders.

## 17. Reporting Reliability

| Desired metric | Current classification | Evidence/limitation |
|---|---|---|
| Store paid-order count | Directly available, but operationally incomplete | `getSalesCount` counts `isPaid=true`; COD never becomes paid |
| Store total revenue | Derivable but unreliable/incomplete | `getTotalRevenue` uses mutable Product.price, ignores item quantity, no status/currency policy |
| Monthly chart | Derivable but unreliable/incomplete | `getGraphRevenue` uses mutable price, ignores quantity, groups by month number only (not year/timezone) |
| Cross-store order count/sales by store | Derivable from `Order.storeId` | No API/helper; requires authorized server aggregate and clear status/payment policy |
| Average order value | Derivable but unreliable | Requires a trustworthy persisted order total and denominator definition |
| Gross sales | Derivable but unreliable | No immutable line/total snapshot; current price can rewrite history |
| Paid orders | Field exists directly | No working current payment path establishes true settlement |
| Taxes, discounts, shipping, refunds, net sales | Impossible as authoritative metrics | No fields/models/events |
| Currency-normalized totals | Not safely available | No currency on Store/Order; formatter is PKR and country defaults to PK |
| Platform revenue/commission | Impossible | No fee/commission/revenue-share fields or rules |
| Invoice basis | Requires backend/schema/business decisions | No defined fee, period, recipient, tax, or accounting semantics |

Dashboard “Products In Stock” is the sum of current non-archived Product.quantity, not sales or product count (`actions/get-stock-count.ts`).

## 18. Cross-Store Reporting Feasibility

Technically, Admin’s Prisma server can group `Order`, `OrderItem`, and `Product` across all stores because `storeId` exists. No current route exposes this and no platform authorization exists. A Super Admin browser must not query PostgreSQL directly or iterate public store APIs to manufacture financial truth.

A safe implementation needs a trusted server-side platform API or service with explicit platform authorization, database-side aggregates/read models, pagination for drill-down, least-privilege PII, audit logging, and a defined sale predicate (for example treatment of DRAFT, CONFIRMED, DELIVERED, CANCELED and COD settlement). Before invoices, immutable order-line pricing, currency, and refund/adjustment semantics are needed.

## 19. Billing / Invoice Readiness

No repository contains an invoice/billing/commission/subscription/monthly-fee model, invoice numbering, billing recipient/address, VAT/tax registration, due date, payment link, invoice status, PDF/document generation, document storage, cron/scheduler, queue, retries, or invoice audit history. Admin `components/user-nav.tsx` has only a static “Billing” menu item with no route or behavior. “Billing plan assignment/change” and “Keep billing manual for Release 1” appear in `Todo.md` as future work, not implementation.

Monthly invoices therefore require a trusted backend/platform domain: billing account and recipient fields, period and timezone, immutable invoice lines, numbering/idempotency, calculation policy, status/payment state, document storage/retrieval, and a manual or scheduled generation workflow. The Super Admin UI should orchestrate/display these capabilities rather than own financial truth.

## 20. Email Infrastructure

Admin has one reusable but narrow path: `lib/resend.ts` creates a Resend client from `RESEND_API_KEY`; `lib/email/send-new-order-notification.ts` builds inline HTML/plain text, resolves the Store owner's primary Clerk email (or `RESEND_TEST_RECIPIENT`), and sends from `RESEND_FROM_EMAIL`. COD catches notification errors after order creation so email failure does not roll back the order.

No React Email template is used despite `@react-email/render` being installed. There are no invoice templates, attachments, PDF support, recipient/billing-contact model, delivery webhooks, retry queue, idempotency key, outbound-message log, or audit trail. Resend could be reused by a trusted platform mail service only after those controls and invoice document ownership are designed.

## 21. Backend / Database Ownership

Admin is the sole verified database owner and authoritative business-logic/API owner in this workspace. Storefront never accesses Prisma. Super Admin should not receive database credentials or instantiate Prisma in a browser-facing app. A platform API can initially live in Admin if isolated and explicitly authorized, or in a dedicated backend later; either way it must centralize platform authorization, aggregate semantics, invoice state, and auditability.

No additional backend, worker, scheduler, queue, shared package, API gateway, or reporting service was found under `D:\Work`.

## 22. Existing Super Admin Repo Assessment

The repository is empty and uncommitted, so there is no framework compatibility problem, unsafe scaffold, or reusable architecture to preserve. It is safe to continue in this repository rather than recreate it. The first implementation choice should establish the framework, Clerk provider/middleware, a server-side platform API client, and an authorization boundary without inventing direct cross-store access.

## 23. Repository Responsibility Boundaries

| Capability | Admin/CMS | Storefront | Super Admin | Trusted platform/backend |
|---|---|---|---|---|
| Merchant auth/store ownership | Current Clerk + `Store.userId` | None | Platform auth UI only | Platform role validation |
| Catalog CRUD | Authoritative | Read-only consumer | Read-only drill-down if permitted | Optional stable read API |
| Cart/customer form | No | Browser/localStorage | No | No |
| Order creation/inventory | COD route and status transactions | Sends payload | No | Future platform operations only |
| Cross-store reports | No current endpoint | No | Dashboard UX | Aggregation/read model |
| Invoice calculation/state/numbering | None | No | UX/actions | Authoritative domain |
| PDF/document storage | None | No | Download/display | Generation/storage/security |
| Invoice email/audit | New-order email only | No | Trigger/status UX | Sending, retries, delivery log |

Avoid duplicating pricing, authorization, tenant bypass rules, payment state, invoice numbering, PDF ownership, or email audit history in the Super Admin frontend.

## 24. Reusable Patterns / Components

Reasonably reusable concepts are the Admin ClerkProvider/sign-in conventions, Prisma singleton pattern (server-only), explicit store-scoped route naming, Tailwind/shadcn visual language, table/chart patterns, Cloudinary URL conventions, Resend client configuration, and the source’s order transition/stock transaction as a domain reference. They should be copied only behind hardened authorization and clarified contracts.

Potential future shared package candidates are versioned DTOs, Zod validation schemas, API error/pagination types, currency/date formatting with explicit currency/time zone, and design tokens. Do not share a Prisma client with a browser app. Do not treat current duplicated client/server validation as a stable contract without versioning.

## 25. Security Findings

Severity is limited to source-supported observations:

- **High platform privilege risk:** there is no platform role/permission source. A future cross-store route must not equate Clerk authentication with Super Admin authority.
- **High tenant-integrity risk:** several child mutations verify the path store owner but mutate by child ID alone; cross-store IDs may be targeted if known. Product/category/size/color foreign IDs are not universally same-store validated.
- **High financial-integrity risk:** current reports recompute totals from mutable Product prices; revenue helpers ignore quantity; no settlement/refund/currency model exists.
- **Medium public-input risk:** COD is intentionally public and CORS allows `*`; it validates item shape, store-scoped product existence, archive, and stock, but has no customer authentication, abuse/rate-limit evidence, or idempotency key.
- **Medium data exposure risk:** public child catalog GETs can be queried by resource ID without an explicit store predicate; order/customer data is not publicly exposed by a current GET route, but any new platform API needs field minimization, pagination, retention, and audit logging.
- **Medium integrity risk:** schema foreign keys do not encode same-store composite relationships; `OrderItem` has no storeId and order totals are not immutable.
- **Low operational risk:** debug `console.log("RequestHit")` and unstructured error/email logs exist; no audit log is present.

The previously reported unauthenticated order-status PATCH and broken billboard child GET are **not current findings**: source now authenticates/owns the status route and correctly scopes billboard child GET. The billboard collection GET remains absent/commented out.

## 26. Previous Discovery Corrections

The prior `ecommerce-admin-cwa/SUPER_ADMIN_DISCOVERY.md` was historical context only and did not inspect Storefront. Current source differs in important ways:

1. Storefront is now verified and has a live quantity-aware cart and COD payload (`items[{productId,quantity}]`), not the old no-quantity model.
2. Admin schema has six migrations, including default COD, homepage billboard, category hierarchy, Product.quantity, and OrderItem.quantity; the old report described only the initial two migrations.
3. Admin `PATCH /orders/[orderId]` now authenticates, verifies store ownership, uses a transition matrix, and transactionally changes stock; the old unauthenticated/order-ID-only finding is stale.
4. Admin billboard child GET now uses both IDs correctly; the collection GET is still commented out.
5. COD product lookup now includes `storeId`, so the old cross-store product lookup finding is corrected in current source. Same-store validation of other foreign IDs and child mutation predicates remains incomplete.
6. `get-homepage-billboard` is a new dedicated Storefront/Admin flow; the old Storefront assumption that a Store ID was passed to billboard-by-ID is no longer current source behavior.
7. Stripe is absent from current Admin and Storefront source. Enum/docs/README references are historical; there is no current checkout/webhook/payment path.
8. Current revenue/order display code uses quantity inconsistently: the order list multiplies quantity, while `getTotalRevenue` and `getGraphRevenue` do not.
9. The previous report’s conclusions that there is no platform role, cross-store reporting, invoice/billing domain, scheduler, or invoice email pipeline remain verified.

The old Admin report itself must remain unchanged. It is classified as **PARTIALLY STALE** because its architecture framing and many billing/Clerk conclusions remain useful, but its current-risk and migration/quantity/payment sections conflict with current source.

## 27. Unknowns

- Production Clerk instance, domains, app sharing, platform-admin provisioning, MFA, claims, and revocation process.
- Production database contents, old Stripe-era rows, price-change history, duplicate orders, data quality, and actual `isPaid` usage.
- Whether external infrastructure outside `D:\Work` runs jobs, reporting, billing, or email tracking.
- Production Resend sender verification/deliverability and Cloudinary account/upload-preset configuration.
- Deployment hosts, domains, CORS proxying, rate limiting, observability, backups, and database connection settings.
- Business definition of a sale, paid COD, refund/cancellation treatment, currency, tax/VAT, discounts, shipping, platform fee/commission, invoice recipient, due dates, period timezone, and legal numbering.
- Whether platform operators need read-only order/customer PII, store-owner impersonation, or any cross-store mutation capability.

## 28. Missing External Systems / Information

Before production billing/reporting, the project needs an explicitly identified platform authorization source, accounting/billing policy, immutable financial data strategy, invoice document storage/generation, scheduler or manual-run mechanism, delivery/retry/audit system, and legal/tax requirements. None is present in the three repositories. A production data inventory is also required before declaring historical sales trustworthy.

## 29. Decisions Required Before Implementation

1. Will platform Super Admin authorization use a dedicated Clerk role/claim, Clerk metadata managed by a trusted backend, or a platform-admin database mapping? How are grants/revocations audited?
2. Will cross-store APIs be added to Admin or a separate platform service? Which fields and mutations are allowed?
3. What constitutes a sale: created, confirmed, delivered, COD collected, or another event? How are canceled and refunded orders treated?
4. Is PKR the only currency, and what are tax, discount, shipping, commission, and period/time-zone rules?
5. Must historical invoices use immutable captured line prices/totals, requiring schema changes/backfill, or is current data only a provisional report?
6. Are invoices manual for Release 1 (as `Todo.md` suggests) or scheduled? What numbering, due date, payment status, recipient, PDF, retention, and resend rules apply?
7. What customer/store-owner PII may platform operators see, and what audit/retention requirements apply?
8. What production Clerk, database, Resend, Cloudinary, and deployment configuration is authoritative?

## 30. Recommended Implementation Sequence

1. Preserve this report and the resume as the reviewed baseline; keep the Storefront `.vscode/settings.json` modification untouched.
2. Establish Super Admin application scaffolding in the empty repository using a compatible Next.js App Router stack and server/client boundaries.
3. Decide and implement a server-validated platform-admin identity check before exposing any cross-store data. Add denial tests and audit hooks first.
4. Define a versioned trusted platform API contract for store list, store detail, order drill-down, and aggregate reporting; do not reuse public catalog routes for platform authorization.
5. Reconcile financial semantics and determine the schema/read-model changes needed for immutable line totals, currency, settlement, refunds, and invoice basis.
6. Add server-side aggregates with date/time-zone/status/payment filters and least-privilege PII; validate against production data samples.
7. Design invoice domain/state/numbering/idempotency, then document and implement manual Release 1 generation before any scheduler.
8. Add PDF/document storage and Resend delivery with recipients, retry/idempotency, secure links/attachments, status webhooks, and audit records.
9. Add Super Admin drill-down/download UI only after the APIs and authorization are stable. Run repository-local lint/type/build checks and provide manual authenticated verification steps.

## 31. Important File Reference Index

### Admin

- `prisma/schema.prisma` — authoritative current Store/catalog/Order/OrderItem model.
- `prisma/migrations/20260918104913_add_product_and_orderitem_quantity/migration.sql` — quantity fields.
- `prisma/migrations/20260917132611_add_category_hierarchy/migration.sql` — category parent/child model.
- `prisma/migrations/20260916144556_add_homepage_billboard/migration.sql` — store homepage billboard.
- `middleware.ts`, `app/layout.tsx`, `app/(root)/layout.tsx`, `app/(dashboard)/[storeId]/layout.tsx` — Clerk and merchant authorization gates.
- `app/api/[storeId]/cod/route.ts` — current public COD creation, authoritative pricing lookup, stock validation, tracking, and notification.
- `app/api/[storeId]/orders/[orderId]/route.ts` — authenticated order transitions and transactional stock changes.
- `app/api/[storeId]/products/route.ts`, `.../categories/route.ts`, `.../homepage-billboard/route.ts` — public catalog contract.
- `app/api/stores/[storeId]/route.ts` — public branding plus owner-protected store mutations.
- `actions/get-total-revenue.ts`, `get-sales-count.ts`, `get-graph-revenue.ts`, `get-stock-count.ts` — current dashboard metrics and limitations.
- `app/(dashboard)/[storeId]/(routes)/orders/page.tsx` — direct Prisma order listing and quantity-aware display total.
- `lib/email/send-new-order-notification.ts`, `lib/resend.ts` — only current email infrastructure.
- `lib/trackingId.ts`, `lib/prismadb.ts`, `components/ui/image-upload.tsx` — tracking, DB singleton, Cloudinary.
- `package.json` — current dependency/payment reality (no Stripe).
- `AGENTS.md`, `CLAUDE.md`, `docs/PROJECT_BRIEF.md`, `Todo.md`, `README.md` — context with varying freshness.
- `SUPER_ADMIN_DISCOVERY.md` — previous Admin-only report; historical and intentionally unchanged.

### Storefront

- `types.ts` — current API DTOs including quantity-aware order payload/response.
- `hooks/use-cart.tsx` — persisted cart and quantity rules.
- `app/(routes)/cart/components/summary.tsx` — COD request and response handling.
- `app/(routes)/cart/components/cod-details-form.tsx` — customer/shipping payload and `country: "PK"`.
- `actions/get-store.tsx`, `get-homepage-billboard.tsx`, `get-products.tsx`, `get-category.tsx` — API clients and env split.
- `app/(routes)/page.tsx`, `category/[categoryId]/page.tsx`, `product/[productId]/page.tsx` — end-to-end catalog consumers.
- `AGENTS.md`, `CLAUDE.md`, `docs/PROJECT_BRIEF.md`, `README.md` — current/partially stale context.

### Super Admin

- Empty repository: only `.git`; no source files yet.

## 32. Final Readiness Assessment

**Do we now have enough verified technical context to begin implementation work in `ecommerce-super-admin`?**

**YES — sufficient technical context to begin.**

There are no technical blockers to starting a safe first phase: scaffold the empty repository, establish the intended Clerk integration boundary, and design a server-validated platform API contract. There are important product/business decisions before implementing financial reporting or invoices—sale semantics, platform authorization provisioning, currency/tax/fee rules, historical-price treatment, invoice numbering/periods, recipients, payment state, and delivery/audit requirements—but those can be resolved during implementation planning. The first phase must not expose cross-store data until the explicit platform authorization and trusted backend boundary are in place.
