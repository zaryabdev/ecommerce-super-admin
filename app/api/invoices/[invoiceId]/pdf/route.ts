import { NextResponse } from "next/server";

import { getInvoicePdf } from "@/lib/admin-api";
import { adminErrorResponse, forbiddenResponse, isGatedOut } from "@/lib/admin-mutation";

export const dynamic = "force-dynamic";

// Same-origin PDF proxy: the browser authenticates with its Clerk session
// cookie and never sees an Admin Bearer token. Admin renders the PDF from the
// stored Invoice snapshot; nothing is recalculated here.
// ?inline=1 opens it in the browser; the default downloads it.
export async function GET(
  req: Request,
  { params }: { params: { invoiceId: string } }
) {
  if (isGatedOut()) return forbiddenResponse();

  try {
    const { bytes, filename } = await getInvoicePdf(params.invoiceId);
    const inline = new URL(req.url).searchParams.get("inline") === "1";
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
