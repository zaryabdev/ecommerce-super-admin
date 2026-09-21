import "server-only";

import { auth } from "@clerk/nextjs";

import type {
  SuperAdminStoresResponse,
  SuperAdminStore,
} from "@/types/super-admin-api";

// The only way Super Admin reads or writes platform data: HTTP calls to the
// privileged namespace of the Admin app (/api/super-admin/...). Super Admin
// has no database access of its own. Server-side only: the Clerk session token
// never reaches client components.
const PRIVILEGED_PREFIX = "/api/super-admin/";

export type AdminApiErrorKind =
  | "config" // Super Admin is misconfigured (e.g. ADMIN_API_URL)
  | "unauthenticated" // Admin did not accept the session token (401)
  | "forbidden" // authenticated but not the designated Super Admin (403)
  | "upstream"; // unreachable, other non-2xx, or unexpected response

// Messages are safe to render; raw Admin/DB details are logged, never surfaced.
export class AdminApiError extends Error {
  constructor(public readonly kind: AdminApiErrorKind, message: string) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function adminApiFetch<T>(path: string): Promise<T> {
  const baseUrl = process.env.ADMIN_API_URL?.trim();
  if (!baseUrl) {
    console.error("[ADMIN_API] ADMIN_API_URL is not configured");
    throw new AdminApiError("config", "ADMIN_API_URL is not configured.");
  }
  if (!path.startsWith(PRIVILEGED_PREFIX)) {
    throw new Error(`Admin API path must start with ${PRIVILEGED_PREFIX}`);
  }

  // Clerk session token; Admin verifies it and checks SUPER_ADMIN_CLERK_USER_ID.
  const token = await auth().getToken();
  if (!token) {
    throw new AdminApiError("unauthenticated", "No active session.");
  }

  let response: Response;
  try {
    response = await fetch(new URL(path, baseUrl), {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error(`[ADMIN_API] GET ${path} unreachable:`, error);
    throw new AdminApiError("upstream", "Could not reach the Admin API.");
  }

  if (response.status === 401) {
    console.error(`[ADMIN_API] GET ${path} -> 401 (session token not accepted)`);
    throw new AdminApiError(
      "unauthenticated",
      "Admin API did not accept the session."
    );
  }
  if (response.status === 403) {
    console.error(`[ADMIN_API] GET ${path} -> 403 (not the designated Super Admin)`);
    throw new AdminApiError(
      "forbidden",
      "Admin API denied access: this account is not the designated Super Admin."
    );
  }
  if (!response.ok) {
    console.error(`[ADMIN_API] GET ${path} -> ${response.status}`);
    throw new AdminApiError("upstream", "The Admin API returned an error.");
  }

  try {
    return (await response.json()) as T;
  } catch {
    console.error(`[ADMIN_API] GET ${path} -> invalid JSON body`);
    throw new AdminApiError("upstream", "The Admin API returned an invalid response.");
  }
}

export async function getSuperAdminStores(): Promise<SuperAdminStore[]> {
  const body = await adminApiFetch<SuperAdminStoresResponse>(
    `${PRIVILEGED_PREFIX}stores`
  );
  if (!body || !Array.isArray(body.stores)) {
    console.error("[ADMIN_API] stores response had an unexpected shape");
    throw new AdminApiError("upstream", "The Admin API returned an invalid response.");
  }
  return body.stores;
}
