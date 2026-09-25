import "server-only";

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { AdminApiError } from "@/lib/admin-api";
import { isSuperAdmin } from "@/lib/super-admin";

// Shared shell of Super Admin's same-origin mutation route handlers. They exist
// only so client components can trigger writes without ever seeing the Clerk
// token: each handler forwards to Admin via lib/admin-api.ts and holds no
// business logic. Admin validates everything and is the real security check.

const errorResponse = (status: number, error: string, message: string) =>
  NextResponse.json({ error, message }, { status });

export async function readJsonObject(
  req: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return null;
}

// Maps any error from lib/admin-api.ts to a safe JSON response.
export function adminErrorResponse(error: unknown): NextResponse {
  if (!(error instanceof AdminApiError)) {
    console.error("[ADMIN_MUTATION]", error);
    return errorResponse(500, "INTERNAL", "Unexpected error.");
  }
  switch (error.kind) {
    case "unauthenticated":
      return errorResponse(401, "UNAUTHENTICATED", error.message);
    case "forbidden":
      return errorResponse(403, "FORBIDDEN", error.message);
    case "not_found":
      return errorResponse(404, error.code ?? "NOT_FOUND", error.message);
    case "rejected":
      return errorResponse(error.status ?? 400, error.code ?? "REJECTED", error.message);
    default:
      return errorResponse(502, "UPSTREAM", error.message);
  }
}

// UI-level gate only; Admin re-checks the Super Admin on every call.
export const isGatedOut = () => !isSuperAdmin(auth().userId);

export const forbiddenResponse = () =>
  errorResponse(403, "FORBIDDEN", "This account is not the designated Super Admin.");

export async function handleAdminMutation(
  run: () => Promise<unknown>,
  successStatus = 200
): Promise<NextResponse> {
  if (isGatedOut()) return forbiddenResponse();

  try {
    return NextResponse.json(await run(), { status: successStatus });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const invalidBody = () =>
  errorResponse(400, "INVALID_BODY", "Request body must be a JSON object.");
