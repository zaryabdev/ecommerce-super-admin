import { auth } from "@clerk/nextjs";

// The only way Super Admin reads or writes platform data: HTTP calls to the
// privileged namespace of the Admin app (conceptually /api/super-admin/...).
// Super Admin has no database access of its own. Server-side only.
const PRIVILEGED_PREFIX = "/api/super-admin/";

export async function adminApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.ADMIN_API_URL;
  if (!baseUrl) {
    throw new Error("ADMIN_API_URL is not configured");
  }
  if (!path.startsWith(PRIVILEGED_PREFIX)) {
    throw new Error(`Admin API path must start with ${PRIVILEGED_PREFIX}`);
  }

  // Clerk session token; Admin verifies it and checks SUPER_ADMIN_CLERK_USER_ID.
  const token = await auth().getToken();
  if (!token) {
    throw new Error("No Clerk session token available");
  }

  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    cache: "no-store",
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Admin API ${response.status} for ${path}`);
  }
  return (await response.json()) as T;
}
