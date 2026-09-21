# Super Admin Todo

## Foundation

- [x] Next.js app scaffold based on Admin's visual/system foundation
- [x] Clerk sign-in + route protection
- [x] Super Admin gated shell/navigation + Dashboard placeholder
- [x] Server-side helper for calling Admin's privileged API (`lib/admin-api.ts`)
- [ ] Manual verification of sign-in, Super Admin access and non-Super-Admin denial

## Depends on Admin (coordinate before changing Admin)

- [x] Admin: privileged `/api/super-admin/...` namespace with Clerk token verification + `SUPER_ADMIN_CLERK_USER_ID` check
- [ ] Admin: cross-Store read endpoints (Store list/detail, owner, order count, sales totals)
- [ ] Admin: monthly eligible-sales definition + calculation
- [ ] Admin: billing-plan model + Store assignment + invoice domain (design not decided)

## Release 1 Features

- [ ] Dashboard metrics
- [x] Store listing
- [x] Store detail (owner info, creation date, order count, sales totals)
- [ ] Billing plan assignment/change
- [ ] Monthly invoice generation (manual)
- [ ] Send / mark invoice
- [ ] Invoice history
