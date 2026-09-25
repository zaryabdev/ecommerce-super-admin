import "server-only";

import { auth } from "@clerk/nextjs";

import type {
  SuperAdminBillingPlan,
  SuperAdminInvoiceDetail,
  SuperAdminInvoiceDetailResponse,
  SuperAdminInvoiceGenerationResult,
  SuperAdminInvoiceInput,
  SuperAdminInvoiceListResponse,
  SuperAdminInvoicePreview,
  SuperAdminInvoicePreviewResponse,
  SuperAdminBillingPlanResponse,
  SuperAdminBillingPlansResponse,
  SuperAdminBillingPlanStatus,
  SuperAdminCreateBillingPlanInput,
  SuperAdminStoreBillingPlan,
  SuperAdminStoreBillingPlanResponse,
  SuperAdminStoreDetail,
  SuperAdminStoreDetailResponse,
  SuperAdminStoreOrdersResponse,
  SuperAdminStoresResponse,
  SuperAdminStore,
  SuperAdminUpdateBillingPlanInput,
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
  | "not_found" // the requested resource does not exist (404)
  | "rejected" // Admin refused the request with a safe message (other 4xx)
  | "upstream"; // unreachable, other non-2xx, or unexpected response

// Messages are safe to render; raw Admin/DB details are logged, never surfaced.
// `status` and `code` are only set for "rejected" errors, where Admin returned
// its stable { error, message } body (e.g. 400 INVALID_DECIMAL).
export class AdminApiError extends Error {
  constructor(
    public readonly kind: AdminApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

interface AdminRequestInit {
  method?: "GET" | "POST" | "PATCH" | "PUT";
  body?: unknown;
  /** Statuses handed back to the caller (body unread) instead of thrown. */
  passThroughStatus?: number[];
}

// Admin's validation/conflict responses are { error: string, message: string }.
// Anything else (plain-text 500s, HTML, etc.) is treated as opaque.
async function readAdminErrorBody(
  response: Response
): Promise<{ code: string; message: string } | null> {
  try {
    const body = (await response.json()) as { error?: unknown; message?: unknown };
    if (typeof body?.error === "string" && typeof body?.message === "string") {
      return { code: body.error, message: body.message };
    }
  } catch {
    // not JSON
  }
  return null;
}

// Authenticated request to Admin with the shared error mapping. Returns the raw
// Response for success (and any passThroughStatus); JSON callers use
// adminApiFetch, binary callers (PDF) read the body themselves.
async function adminApiRequest(
  path: string,
  { method = "GET", body, passThroughStatus = [] }: AdminRequestInit = {}
): Promise<Response> {
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
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch (error) {
    console.error(`[ADMIN_API] ${method} ${path} unreachable:`, error);
    throw new AdminApiError("upstream", "Could not reach the Admin API.");
  }

  if (passThroughStatus.includes(response.status)) return response;

  if (response.status === 401) {
    console.error(`[ADMIN_API] ${method} ${path} -> 401 (session token not accepted)`);
    throw new AdminApiError(
      "unauthenticated",
      "Admin API did not accept the session."
    );
  }
  if (response.status === 403) {
    console.error(`[ADMIN_API] ${method} ${path} -> 403 (not the designated Super Admin)`);
    throw new AdminApiError(
      "forbidden",
      "Admin API denied access: this account is not the designated Super Admin."
    );
  }
  if (response.status === 404) {
    const detail = await readAdminErrorBody(response);
    throw new AdminApiError(
      "not_found",
      detail?.message ?? "Not found.",
      404,
      detail?.code
    );
  }
  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      const detail = await readAdminErrorBody(response);
      if (detail) {
        throw new AdminApiError(
          "rejected",
          detail.message,
          response.status,
          detail.code
        );
      }
    }
    console.error(`[ADMIN_API] ${method} ${path} -> ${response.status}`);
    throw new AdminApiError("upstream", "The Admin API returned an error.");
  }

  return response;
}

async function adminApiFetch<T>(
  path: string,
  init: AdminRequestInit = {}
): Promise<T> {
  const response = await adminApiRequest(path, init);
  try {
    return (await response.json()) as T;
  } catch {
    console.error(`[ADMIN_API] ${init.method ?? "GET"} ${path} -> invalid JSON body`);
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

export async function getSuperAdminStore(
  storeId: string
): Promise<SuperAdminStoreDetail> {
  const body = await adminApiFetch<SuperAdminStoreDetailResponse>(
    `${PRIVILEGED_PREFIX}stores/${encodeURIComponent(storeId)}`
  );
  if (!body || !body.store || typeof body.store.id !== "string") {
    console.error("[ADMIN_API] store detail response had an unexpected shape");
    throw new AdminApiError("upstream", "The Admin API returned an invalid response.");
  }
  return body.store;
}

export async function getSuperAdminStoreOrders(
  storeId: string,
  page: number,
  pageSize: number
): Promise<SuperAdminStoreOrdersResponse> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const body = await adminApiFetch<SuperAdminStoreOrdersResponse>(
    `${PRIVILEGED_PREFIX}stores/${encodeURIComponent(storeId)}/orders?${query}`
  );
  if (!body || !Array.isArray(body.orders) || !body.pagination) {
    console.error("[ADMIN_API] store orders response had an unexpected shape");
    throw new AdminApiError("upstream", "The Admin API returned an invalid response.");
  }
  return body;
}

const invalidResponse = (what: string) => {
  console.error(`[ADMIN_API] ${what} response had an unexpected shape`);
  return new AdminApiError("upstream", "The Admin API returned an invalid response.");
};

const isPlan = (plan: unknown): plan is SuperAdminBillingPlan =>
  typeof plan === "object" &&
  plan !== null &&
  typeof (plan as SuperAdminBillingPlan).id === "string";

export async function getBillingPlans(
  status: SuperAdminBillingPlanStatus = "all"
): Promise<SuperAdminBillingPlan[]> {
  const body = await adminApiFetch<SuperAdminBillingPlansResponse>(
    `${PRIVILEGED_PREFIX}billing-plans?${new URLSearchParams({ status })}`
  );
  if (!body || !Array.isArray(body.plans)) throw invalidResponse("billing plans");
  return body.plans;
}

export async function getBillingPlan(
  planId: string
): Promise<SuperAdminBillingPlan> {
  const body = await adminApiFetch<SuperAdminBillingPlanResponse>(
    `${PRIVILEGED_PREFIX}billing-plans/${encodeURIComponent(planId)}`
  );
  if (!body || !isPlan(body.plan)) throw invalidResponse("billing plan");
  return body.plan;
}

export async function createBillingPlan(
  input: SuperAdminCreateBillingPlanInput
): Promise<SuperAdminBillingPlan> {
  const body = await adminApiFetch<SuperAdminBillingPlanResponse>(
    `${PRIVILEGED_PREFIX}billing-plans`,
    { method: "POST", body: input }
  );
  if (!body || !isPlan(body.plan)) throw invalidResponse("create billing plan");
  return body.plan;
}

export async function updateBillingPlan(
  planId: string,
  input: SuperAdminUpdateBillingPlanInput
): Promise<SuperAdminBillingPlan> {
  const body = await adminApiFetch<SuperAdminBillingPlanResponse>(
    `${PRIVILEGED_PREFIX}billing-plans/${encodeURIComponent(planId)}`,
    { method: "PATCH", body: input }
  );
  if (!body || !isPlan(body.plan)) throw invalidResponse("update billing plan");
  return body.plan;
}

export async function getStoreBillingPlan(
  storeId: string
): Promise<SuperAdminStoreBillingPlan> {
  const body = await adminApiFetch<SuperAdminStoreBillingPlanResponse>(
    `${PRIVILEGED_PREFIX}stores/${encodeURIComponent(storeId)}/billing-plan`
  );
  if (!body || !body.store || typeof body.store.id !== "string") {
    throw invalidResponse("store billing plan");
  }
  return body.store;
}

/** `billingPlanId: null` unassigns the Store's current plan. */
export async function updateStoreBillingPlan(
  storeId: string,
  billingPlanId: string | null
): Promise<SuperAdminStoreBillingPlan> {
  const body = await adminApiFetch<SuperAdminStoreBillingPlanResponse>(
    `${PRIVILEGED_PREFIX}stores/${encodeURIComponent(storeId)}/billing-plan`,
    { method: "PUT", body: { billingPlanId } }
  );
  if (!body || !body.store || typeof body.store.id !== "string") {
    throw invalidResponse("update store billing plan");
  }
  return body.store;
}

// ---------- Invoices (Admin owns every calculation; Super Admin only relays) ----------

export async function getInvoices(params: {
  storeId?: string;
  page: number;
  pageSize: number;
}): Promise<SuperAdminInvoiceListResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.storeId) query.set("storeId", params.storeId);
  const body = await adminApiFetch<SuperAdminInvoiceListResponse>(
    `${PRIVILEGED_PREFIX}invoices?${query}`
  );
  if (!body || !Array.isArray(body.invoices) || !body.pagination) {
    throw invalidResponse("invoices");
  }
  return body;
}

export async function getInvoice(
  invoiceId: string
): Promise<SuperAdminInvoiceDetail> {
  const body = await adminApiFetch<SuperAdminInvoiceDetailResponse>(
    `${PRIVILEGED_PREFIX}invoices/${encodeURIComponent(invoiceId)}`
  );
  if (!body || !body.invoice || typeof body.invoice.id !== "string") {
    throw invalidResponse("invoice");
  }
  return body.invoice;
}

export async function previewInvoice(
  storeId: string,
  input: SuperAdminInvoiceInput
): Promise<SuperAdminInvoicePreview> {
  const body = await adminApiFetch<SuperAdminInvoicePreviewResponse>(
    `${PRIVILEGED_PREFIX}stores/${encodeURIComponent(storeId)}/invoices/preview`,
    { method: "POST", body: input }
  );
  if (!body || !body.preview) throw invalidResponse("invoice preview");
  return body.preview;
}

/** Only the generation inputs are sent; Admin derives every other value. */
export async function generateInvoice(
  storeId: string,
  input: SuperAdminInvoiceInput
): Promise<SuperAdminInvoiceGenerationResult> {
  const body = await adminApiFetch<SuperAdminInvoiceGenerationResult>(
    `${PRIVILEGED_PREFIX}stores/${encodeURIComponent(storeId)}/invoices`,
    { method: "POST", body: input }
  );
  if (!body || !body.invoice || !body.delivery) throw invalidResponse("generate invoice");
  return body;
}

// Admin answers a FAILED delivery with 502 EMAIL_DELIVERY_FAILED but still
// includes the updated invoice + delivery result. That is a normal outcome for
// the UI (the invoice exists), so both cases come back as one result.
export async function resendInvoiceEmail(
  invoiceId: string
): Promise<SuperAdminInvoiceGenerationResult> {
  const body = await adminApiFetch<SuperAdminInvoiceGenerationResult>(
    `${PRIVILEGED_PREFIX}invoices/${encodeURIComponent(invoiceId)}/send-email`,
    { method: "POST", passThroughStatus: [502] }
  );
  if (!body || !body.invoice || !body.delivery) throw invalidResponse("resend invoice email");
  return body;
}

export async function getInvoicePdf(invoiceId: string) {
  const response = await adminApiRequest(
    `${PRIVILEGED_PREFIX}invoices/${encodeURIComponent(invoiceId)}/pdf`
  );
  if (!(response.headers.get("content-type") ?? "").startsWith("application/pdf")) {
    throw invalidResponse("invoice pdf");
  }
  const filename =
    /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ??
    "invoice.pdf";
  return { bytes: await response.arrayBuffer(), filename };
}
