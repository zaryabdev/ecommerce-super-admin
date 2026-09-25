import Link from "next/link";

import { GenerateInvoiceDialog } from "@/components/invoices/generate-invoice-dialog";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { SuperAdminInvoiceListResponse } from "@/types/super-admin-api";

// Invoice history for one Store (same list API filtered by storeId). Generating
// from here locks the Store selection.
export const StoreInvoicesCard = ({
  store,
  invoices,
  error,
}: {
  store: { id: string; name: string };
  invoices: SuperAdminInvoiceListResponse | null;
  error: string;
}) => (
  <div className="space-y-4 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h3 className="text-xl font-semibold tracking-tight">Invoices</h3>
      <GenerateInvoiceDialog store={store} />
    </div>
    {!invoices ? (
      <Alert variant="destructive">
        <AlertTitle>Could not load invoices</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    ) : invoices.pagination.totalCount === 0 ? (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        This store has no invoices yet.
      </div>
    ) : (
      <>
        <InvoicesTable invoices={invoices.invoices} showStore={false} />
        {invoices.pagination.totalCount > invoices.invoices.length && (
          <div className="text-sm text-muted-foreground">
            Showing the {invoices.invoices.length} most recent of{" "}
            {invoices.pagination.totalCount}.{" "}
            <Button variant="link" className="h-auto p-0" asChild>
              <Link href={`/invoices?storeId=${encodeURIComponent(store.id)}`}>
                View all invoices
              </Link>
            </Button>
          </div>
        )}
      </>
    )}
  </div>
);
