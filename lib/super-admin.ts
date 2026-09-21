// Frontend-side identification of the single designated Super Admin.
//
// This is a UX gate only: it decides whether to render the shell. It is NOT
// the security boundary — Admin's privileged API must independently validate
// the same Clerk user id on every request. Fails closed when unset.
export function isSuperAdmin(userId: string | null | undefined): boolean {
  const superAdminId = process.env.SUPER_ADMIN_CLERK_USER_ID?.trim();
  return Boolean(userId && superAdminId && userId === superAdminId);
}
