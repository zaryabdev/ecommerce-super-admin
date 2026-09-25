// Response contracts of Admin's privileged API (/api/super-admin/...).
// Owned by Admin; keep in sync with its route handlers.

export interface SuperAdminStore {
  id: string;
  name: string;
  /** ISO 8601 date string. */
  createdAt: string;
  orderCount: number;
  /** Decimal string. Never convert to a JS number in the API layer. */
  salesTotal: string;
  currency: string;
}

export interface SuperAdminStoresResponse {
  stores: SuperAdminStore[];
}

export interface SuperAdminStoreOwner {
  /** Clerk user id. */
  userId: string;
  /** Null when the Clerk user has no name or could not be resolved. */
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface SuperAdminStoreDetail extends SuperAdminStore {
  owner: SuperAdminStoreOwner;
}

export interface SuperAdminStoreDetailResponse {
  store: SuperAdminStoreDetail;
}

export type SuperAdminOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "DELIVERED"
  | "CANCELED";

export type SuperAdminPaymentMethod = "COD" | "STRIPE";

export interface SuperAdminOrder {
  id: string;
  trackingId: string;
  /** ISO 8601 date string. */
  createdAt: string;
  status: SuperAdminOrderStatus;
  itemCount: number;
  /** Decimal string. Never convert to a JS number. */
  total: string;
  currency: string;
  paymentMethod: SuperAdminPaymentMethod;
}

export interface SuperAdminPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SuperAdminStoreOrdersResponse {
  orders: SuperAdminOrder[];
  pagination: SuperAdminPagination;
}

export type SuperAdminBillingPlanType = "FIXED" | "PERCENTAGE";

export type SuperAdminBillingPlanStatus = "all" | "active" | "archived";

export interface SuperAdminBillingPlan {
  id: string;
  name: string;
  type: SuperAdminBillingPlanType;
  /** Decimal string; null unless type is FIXED. Never convert to a JS number. */
  fixedAmount: string | null;
  /** Decimal string; null unless type is PERCENTAGE. Unit is not yet decided. */
  percentageRate: string | null;
  isArchived: boolean;
  /** ISO 8601 date string. */
  createdAt: string;
  /** ISO 8601 date string. */
  updatedAt: string;
}

export interface SuperAdminBillingPlansResponse {
  plans: SuperAdminBillingPlan[];
}

export interface SuperAdminBillingPlanResponse {
  plan: SuperAdminBillingPlan;
}

export interface SuperAdminCreateBillingPlanInput {
  name: string;
  type: SuperAdminBillingPlanType;
  fixedAmount: string | null;
  percentageRate: string | null;
}

export interface SuperAdminUpdateBillingPlanInput {
  name?: string;
  type?: SuperAdminBillingPlanType;
  fixedAmount?: string | null;
  percentageRate?: string | null;
  isArchived?: boolean;
}

export interface SuperAdminStoreBillingPlan {
  id: string;
  name: string;
  billingPlanId: string | null;
  /** May be archived: archiving a plan never rewrites Stores that use it. */
  billingPlan: SuperAdminBillingPlan | null;
}

export interface SuperAdminStoreBillingPlanResponse {
  store: SuperAdminStoreBillingPlan;
}

// ---------- Invoices ----------

export type SuperAdminInvoicePaymentStatus = "PENDING" | "PAID";
export type SuperAdminInvoiceEmailStatus = "NOT_SENT" | "SENT" | "FAILED";

export interface SuperAdminInvoiceListItem {
  id: string;
  invoiceNumber: string;
  storeId: string;
  storeName: string;
  billingMonthYear: number;
  billingMonthMonth: number;
  /** ISO 8601 date strings. */
  invoiceDate: string;
  dueDate: string;
  /** Decimal string. */
  total: string;
  currency: string;
  paymentStatus: SuperAdminInvoicePaymentStatus;
  emailStatus: SuperAdminInvoiceEmailStatus;
  emailSentAt: string | null;
  emailAttemptCount: number;
}

export interface SuperAdminInvoiceListResponse {
  invoices: SuperAdminInvoiceListItem[];
  pagination: SuperAdminPagination;
}

/** The permanent stored Invoice snapshot. All amounts are decimal strings. */
export interface SuperAdminInvoice {
  id: string;
  invoiceNumber: string;
  storeId: string;
  billingMonthYear: number;
  billingMonthMonth: number;
  invoiceDate: string;
  dueDate: string;
  billingPlanId: string;
  billingPlanName: string;
  billingPlanType: SuperAdminBillingPlanType;
  fixedAmount: string | null;
  /** Percentage points: "2.5" means 2.5%. */
  percentageRate: string | null;
  eligibleSales: string;
  basePlatformFee: string;
  additionalCharge: string;
  discount: string;
  total: string;
  currency: string;
  notes: string | null;
  paymentStatus: SuperAdminInvoicePaymentStatus;
  emailStatus: SuperAdminInvoiceEmailStatus;
  emailSentAt: string | null;
  lastEmailAttemptAt: string | null;
  emailError: string | null;
  emailAttemptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminInvoiceDetail extends SuperAdminInvoice {
  store: { id: string; name: string };
}

export interface SuperAdminInvoiceDetailResponse {
  invoice: SuperAdminInvoiceDetail;
}

/** The only values a client may submit for preview/generation. */
export interface SuperAdminInvoiceInput {
  billingMonthYear: number;
  billingMonthMonth: number;
  additionalCharge: string;
  discount: string;
  notes: string | null;
}

export interface SuperAdminInvoicePreview {
  store: { id: string; name: string };
  billingMonthYear: number;
  billingMonthMonth: number;
  periodStart: string;
  periodEnd: string;
  billingPlan: {
    id: string;
    name: string;
    type: SuperAdminBillingPlanType;
    fixedAmount: string | null;
    percentageRate: string | null;
    isArchived: boolean;
  };
  eligibleSales: string;
  eligibleOrderCount: number;
  basePlatformFee: string;
  additionalCharge: string;
  discount: string;
  total: string;
  currency: string;
  notes: string | null;
  paymentStatus: SuperAdminInvoicePaymentStatus;
}

export interface SuperAdminInvoicePreviewResponse {
  preview: SuperAdminInvoicePreview;
}

/** Result of Generate & Send, and of Resend Email. The Invoice exists either way. */
export interface SuperAdminInvoiceGenerationResult {
  invoice: SuperAdminInvoice;
  delivery: { status: "SENT" | "FAILED"; error: string | null };
}
