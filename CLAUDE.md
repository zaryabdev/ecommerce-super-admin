# CLAUDE.md — Super Admin Repository

Read `AGENTS.md` (rules), `docs/PROJECT_BRIEF.md` (architecture) and `Todo.md` (work) first. Current source is the final authority.

- This repo is a frontend that consumes Admin's privileged API. Never add Prisma, a database connection, or a second backend here.
- Authorization: Clerk + one configured user id (`SUPER_ADMIN_CLERK_USER_ID`). No RBAC, no SuperAdmin table, no own auth backend. The UI gate is convenience; Admin's API is the real check.
- Keep changes minimal. No dependency upgrades, unrelated refactors, or premature abstractions.
- Do not implement billing-plan schema, automated billing, restaurant features, reviews, or order product name/size/color snapshots.
- Never run browser automation; the owner tests manually. Never commit unless asked.
