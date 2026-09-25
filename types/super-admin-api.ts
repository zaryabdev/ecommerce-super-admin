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
