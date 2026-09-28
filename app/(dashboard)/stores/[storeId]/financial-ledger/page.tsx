import Link from 'next/link';

import { LedgerSummaryCards } from '@/components/financial-ledger/ledger-summary-cards';
import { LedgerTable } from '@/components/financial-ledger/ledger-table';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AdminApiError,
  getStoreFinancialLedger,
  getSuperAdminStore,
} from '@/lib/admin-api';
import type {
  SuperAdminStoreDetail,
  SuperAdminStoreFinancialLedgerResponse,
} from '@/types/super-admin-api';

// Per-request platform data behind auth; never statically rendered.
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const parsePage = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
};

const BackLink = ({ storeId }: { storeId: string }) => (
  <Link
    href={`/stores/${storeId}`}
    className="text-sm text-muted-foreground hover:text-primary"
  >
    ← Back to store
  </Link>
);

const StoreFinancialLedgerPage = async ({
  params,
  searchParams,
}: {
  params: { storeId: string };
  searchParams: { page?: string | string[] };
}) => {
  const page = parsePage(searchParams.page);

  let store: SuperAdminStoreDetail | null = null;
  let notFound = false;
  let storeErrorMessage = '';

  try {
    store = await getSuperAdminStore(params.storeId);
  } catch (error) {
    if (error instanceof AdminApiError) {
      notFound = error.kind === 'not_found';
      storeErrorMessage = error.message;
    } else {
      storeErrorMessage = 'Unexpected error while loading the store.';
      console.error('[STORE_FINANCIAL_LEDGER]', error);
    }
  }

  if (!store) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <BackLink storeId={params.storeId} />
          {notFound ? (
            <>
              <Heading
                title="Store not found"
                description="This store does not exist or has been removed."
              />
              <Separator />
            </>
          ) : (
            <>
              <Heading title="Financial Ledger" description="Store financial ledger" />
              <Separator />
              <Alert variant="destructive">
                <AlertTitle>Could not load store</AlertTitle>
                <AlertDescription>{storeErrorMessage}</AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </div>
    );
  }

  let ledger: SuperAdminStoreFinancialLedgerResponse | null = null;
  let ledgerError = '';
  try {
    ledger = await getStoreFinancialLedger(store.id, page, PAGE_SIZE);
  } catch (error) {
    if (error instanceof AdminApiError) {
      ledgerError = error.message;
    } else {
      ledgerError = 'Unexpected error while loading the financial ledger.';
      console.error('[STORE_FINANCIAL_LEDGER]', error);
    }
  }

  const href = (p: number) => `/stores/${store!.id}/financial-ledger?page=${p}`;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BackLink storeId={store.id} />
        <Heading title="Financial Ledger" description={store.name} />
        <Separator />

        {!ledger ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load the financial ledger</AlertTitle>
            <AlertDescription>{ledgerError}</AlertDescription>
          </Alert>
        ) : (
          <>
            <LedgerSummaryCards summary={ledger.summary} />
            {ledger.pagination.totalCount === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No ledger activity yet — this store has no invoices.
              </div>
            ) : ledger.entries.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No transactions on this page.{' '}
                <Link href={href(ledger.pagination.totalPages)} className="underline">
                  Go to the last page
                </Link>
              </div>
            ) : (
              <>
                <LedgerTable entries={ledger.entries} currency={ledger.summary.currency} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Page {ledger.pagination.page} of {ledger.pagination.totalPages} ·{' '}
                    {ledger.pagination.totalCount} transaction
                    {ledger.pagination.totalCount === 1 ? '' : 's'}
                  </span>
                  <div className="flex gap-2">
                    {ledger.pagination.page <= 1 ? (
                      <Button variant="outline" size="sm" disabled>
                        Previous
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={href(ledger.pagination.page - 1)}>Previous</Link>
                      </Button>
                    )}
                    {ledger.pagination.page >= ledger.pagination.totalPages ? (
                      <Button variant="outline" size="sm" disabled>
                        Next
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={href(ledger.pagination.page + 1)}>Next</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StoreFinancialLedgerPage;
