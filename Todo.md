# Super Admin Todo

## Foundation

- [x] Next.js app scaffold based on Admin's visual/system foundation
- [x] Clerk sign-in + route protection
- [x] Super Admin gated shell/navigation + Dashboard placeholder
- [x] Server-side helper for calling Admin's privileged API (`lib/admin-api.ts`)
- [x] Manual verification of sign-in, Super Admin access and non-Super-Admin denial

## Depends on Admin (coordinate before changing Admin)

- [x] Admin: privileged `/api/super-admin/...` namespace with Clerk token verification + `SUPER_ADMIN_CLERK_USER_ID` check
- [x] Admin: cross-Store read endpoints (Store list/detail, owner, order count, sales totals)
- [ ] Admin: monthly eligible-sales definition + calculation
- [x] Admin: billing-plan model + Store assignment API (`/api/super-admin/billing-plans`, `/stores/:id/billing-plan`)
- [ ] Admin: invoice domain (design not decided)

## Release 1 Features

- [ ] Dashboard metrics
- [x] Store listing
- [x] Store detail (owner info, creation date, order count, sales totals)
- [x] Store order history + pagination (implemented; tsc/lint/build pass; manual verification pending)
- [x] Billing Plans — Super Admin UI: plan management (create/edit/archive/restore) + Store billing-plan assignment (tsc/lint/build pass; manual verification pending)
- [ ] Monthly invoice generation (manual)
- [ ] Send / mark invoice
- [ ] Invoice history
