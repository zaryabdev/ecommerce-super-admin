import { request } from "@/lib/billing-client";
import type {
  SuperAdminInvoiceGenerationResult,
  SuperAdminInvoiceInput,
  SuperAdminInvoicePreview,
} from "@/types/super-admin-api";

// Browser-side calls to Super Admin's same-origin invoice routes, which relay to
// Admin server-side. Errors are BillingRequestError with Admin's safe message
// and stable `code`.

export const previewInvoiceRequest = async (
  storeId: string,
  input: SuperAdminInvoiceInput
) =>
  (
    await request<{ preview: SuperAdminInvoicePreview }>(
      `/api/stores/${encodeURIComponent(storeId)}/invoices/preview`,
      "POST",
      input
    )
  ).preview;

export const generateInvoiceRequest = (
  storeId: string,
  input: SuperAdminInvoiceInput
) =>
  request<SuperAdminInvoiceGenerationResult>(
    `/api/stores/${encodeURIComponent(storeId)}/invoices`,
    "POST",
    input
  );

export const resendInvoiceEmailRequest = (invoiceId: string) =>
  request<SuperAdminInvoiceGenerationResult>(
    `/api/invoices/${encodeURIComponent(invoiceId)}/send-email`,
    "POST",
    {}
  );

export const invoicePdfUrl = (invoiceId: string, inline = false) =>
  `/api/invoices/${encodeURIComponent(invoiceId)}/pdf${inline ? "?inline=1" : ""}`;
