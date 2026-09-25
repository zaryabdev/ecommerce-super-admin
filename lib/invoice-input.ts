import type { SuperAdminInvoiceInput } from "@/types/super-admin-api";

// The only fields a client may submit for preview/generation. Everything else
// (plan, sales, fees, total, number, dates, statuses) is derived by Admin, so
// nothing else is forwarded even if a caller sends it.
export const invoiceInputFromBody = (
  body: Record<string, unknown>
): SuperAdminInvoiceInput =>
  ({
    billingMonthYear: body.billingMonthYear,
    billingMonthMonth: body.billingMonthMonth,
    additionalCharge: body.additionalCharge,
    discount: body.discount,
    notes: body.notes,
  }) as SuperAdminInvoiceInput;
