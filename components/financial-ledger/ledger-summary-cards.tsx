import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney2 } from "@/lib/utils";
import type { SuperAdminStoreFinancialLedgerSummary } from "@/types/super-admin-api";

// User-facing labels intentionally avoid accounting terms (Debit/Credit) even
// though the API keeps them (totalDebit/totalCredit) for the ledger rows.
export const LedgerSummaryCards = ({
  summary,
}: {
  summary: SuperAdminStoreFinancialLedgerSummary;
}) => (
  <div className="grid gap-4 sm:grid-cols-3">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatMoney2(summary.outstandingBalance, summary.currency)}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatMoney2(summary.totalDebit, summary.currency)}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatMoney2(summary.totalCredit, summary.currency)}
        </div>
      </CardContent>
    </Card>
  </div>
);
