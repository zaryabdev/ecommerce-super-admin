import { markInvoicePaid } from "@/lib/admin-api";
import { handleAdminMutation, invalidBody, readJsonObject } from "@/lib/admin-mutation";

export const dynamic = "force-dynamic";

// Thin same-origin proxy: no business logic, no Prisma. Admin owns validation
// (amount is always the stored Invoice total; only Notes is client-supplied).
export async function POST(
  req: Request,
  { params }: { params: { invoiceId: string } }
) {
  const body = await readJsonObject(req);
  if (!body) return invalidBody();

  const notes = typeof body.notes === "string" ? body.notes : null;

  return handleAdminMutation(() => markInvoicePaid(params.invoiceId, { notes }));
}
