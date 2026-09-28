import Link from "next/link";

import { LedgerSummaryCards } from "@/components/financial-ledger/ledger-summary-cards";
import { LedgerTable } from "@/components/financial-ledger/ledger-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { SuperAdminStoreFinancialLedgerResponse } from "@/types/super-admin-api";

// Store Detail's compact Financial Ledger section: summary + the ~10 most
// recent transactions, with a link to the dedicated full ledger page.
export const StoreLedgerCard = ({
  storeId,
  ledger,
  error,
}: {
  storeId: string;
  ledger: SuperAdminStoreFinancialLedgerResponse | null;
  error: string;
}) => (
  <div className="space-y-4 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h3 className="text-xl font-semibold tracking-tight">Financial Ledger</h3>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/stores/${storeId}/financial-ledger`}>View full ledger</Link>
      </Button>
    </div>
    {!ledger ? (
      <Alert variant="destructive">
        <AlertTitle>Could not load the financial ledger</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    ) : (
      <>
        <LedgerSummaryCards summary={ledger.summary} />
        {ledger.pagination.totalCount === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No ledger activity yet — this store has no invoices.
          </div>
        ) : (
          <>
            <LedgerTable entries={ledger.entries} currency={ledger.summary.currency} />
            {ledger.pagination.totalCount > ledger.entries.length && (
              <p className="text-sm text-muted-foreground">
                Showing the {ledger.entries.length} most recent of{" "}
                {ledger.pagination.totalCount} transactions.
              </p>
            )}
          </>
        )}
      </>
    )}
  </div>
);
