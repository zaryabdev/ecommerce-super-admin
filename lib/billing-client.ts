import type {
  SuperAdminBillingPlan,
  SuperAdminCreateBillingPlanInput,
  SuperAdminStoreBillingPlan,
  SuperAdminUpdateBillingPlanInput,
} from "@/types/super-admin-api";

// Browser-side calls to Super Admin's own same-origin mutation routes
// (app/api/...), which forward to Admin server-side. No token lives here.
// Errors carry Admin's safe message; anything unexpected gets a fallback.

// `code` is Admin's stable error code (e.g. INVOICE_ALREADY_EXISTS) when known.
export class BillingRequestError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
  }
}

const FALLBACK = "Something went wrong. Please try again.";

export async function request<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT",
  body: unknown
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new BillingRequestError("Could not reach the server. Please try again.");
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // non-JSON body; handled below
  }

  if (!response.ok) {
    const { message, error } = (data ?? {}) as { message?: unknown; error?: unknown };
    throw new BillingRequestError(
      typeof message === "string" && message ? message : FALLBACK,
      typeof error === "string" ? error : undefined
    );
  }
  if (!data) throw new BillingRequestError(FALLBACK);
  return data as T;
}

export const createBillingPlanRequest = async (
  input: SuperAdminCreateBillingPlanInput
) =>
  (await request<{ plan: SuperAdminBillingPlan }>("/api/billing-plans", "POST", input))
    .plan;

export const updateBillingPlanRequest = async (
  planId: string,
  input: SuperAdminUpdateBillingPlanInput
) =>
  (
    await request<{ plan: SuperAdminBillingPlan }>(
      `/api/billing-plans/${encodeURIComponent(planId)}`,
      "PATCH",
      input
    )
  ).plan;

export const updateStoreBillingPlanRequest = async (
  storeId: string,
  billingPlanId: string | null
) =>
  (
    await request<{ store: SuperAdminStoreBillingPlan }>(
      `/api/stores/${encodeURIComponent(storeId)}/billing-plan`,
      "PUT",
      { billingPlanId }
    )
  ).store;
