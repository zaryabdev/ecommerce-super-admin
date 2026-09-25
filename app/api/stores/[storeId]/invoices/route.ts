import { generateInvoice } from "@/lib/admin-api";
import { handleAdminMutation, invalidBody, readJsonObject } from "@/lib/admin-mutation";
import { invoiceInputFromBody } from "@/lib/invoice-input";

export const dynamic = "force-dynamic";

// Generation succeeds (201) even when the follow-up email fails: the body's
// delivery/invoice.emailStatus says what happened to the email.
export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const body = await readJsonObject(req);
  if (!body) return invalidBody();
  return handleAdminMutation(
    () => generateInvoice(params.storeId, invoiceInputFromBody(body)),
    201
  );
}
