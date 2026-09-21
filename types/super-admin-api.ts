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
