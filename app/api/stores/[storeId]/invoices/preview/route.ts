import { previewInvoice } from "@/lib/admin-api";
import { handleAdminMutation, invalidBody, readJsonObject } from "@/lib/admin-mutation";
import { invoiceInputFromBody } from "@/lib/invoice-input";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const body = await readJsonObject(req);
  if (!body) return invalidBody();
  return handleAdminMutation(async () => ({
    preview: await previewInvoice(params.storeId, invoiceInputFromBody(body)),
  }));
}
