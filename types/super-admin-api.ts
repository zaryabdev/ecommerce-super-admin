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
