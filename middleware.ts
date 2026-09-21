import { authMiddleware } from "@clerk/nextjs";

// Every route requires a Clerk session except the sign-in page. Identifying the
// Super Admin (SUPER_ADMIN_CLERK_USER_ID) happens in the (dashboard) layout;
// authoritative authorization happens in Admin's privileged API.
export default authMiddleware({
  publicRoutes: ["/sign-in(.*)"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
