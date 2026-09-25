import { resendInvoiceEmail } from "@/lib/admin-api";
import { handleAdminMutation } from "@/lib/admin-mutation";

export const dynamic = "force-dynamic";

// 200 with { invoice, delivery } for both a successful and a failed resend:
// the client reads delivery.status. Real errors (not found, auth) are non-2xx.
export async function POST(
  _req: Request,
  { params }: { params: { invoiceId: string } }
) {
  return handleAdminMutation(() => resendInvoiceEmail(params.invoiceId));
}
