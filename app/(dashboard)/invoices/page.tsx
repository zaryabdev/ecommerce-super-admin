import Link from 'next/link';

import { GenerateInvoiceDialog } from '@/components/invoices/generate-invoice-dialog';
import { InvoicesTable } from '@/components/invoices/invoices-table';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AdminApiError,
  getInvoices,
  getSuperAdminStores,
} from '@/lib/admin-api';
import type {
  SuperAdminInvoiceListResponse,
  SuperAdminStore,
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

const parseStoreId = (value: string | string[] | undefined) => {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim();
  return raw ? raw : undefined;
};

const message = (error: unknown, fallback: string, tag: string) => {
  if (error instanceof AdminApiError) return error.message;
  console.error(tag, error);
  return fallback;
};

const InvoicesPage = async ({
  searchParams,
}: {
  searchParams: { page?: string | string[]; storeId?: string | string[] };
}) => {
  const page = parsePage(searchParams.page);
  const storeId = parseStoreId(searchParams.storeId);

  let data: SuperAdminInvoiceListResponse | null = null;
  let errorMessage = '';
  let stores: SuperAdminStore[] | null = null;
  let storesError = '';

  await Promise.all([
    getInvoices({ storeId, page, pageSize: PAGE_SIZE }).then(
      (result) => {
        data = result;
      },
      (error: unknown) => {
        errorMessage = message(error, 'Unexpected error while loading invoices.', '[INVOICES]');
      }
    ),
    getSuperAdminStores().then(
      (result) => {
        stores = result;
      },
      (error: unknown) => {
        storesError = message(error, 'Could not load stores.', '[INVOICES_STORES]');
      }
    ),
  ]);

  const storeOptions = stores
    ? (stores as SuperAdminStore[]).map(({ id, name }) => ({ id, name }))
    : null;
  const filteredStoreName = storeId
    ? (stores as SuperAdminStore[] | null)?.find((s) => s.id === storeId)?.name
    : undefined;
  const list = data as SuperAdminInvoiceListResponse | null;
  const href = (p: number) =>
    `/invoices?${new URLSearchParams({
      ...(storeId ? { storeId } : {}),
      page: String(p),
    })}`;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Heading
            title="Invoices"
            description="Platform invoices issued to stores."
          />
          <GenerateInvoiceDialog stores={storeOptions} storesError={storesError} />
        </div>
        <Separator />
        {storeId && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Showing invoices for{' '}
              <span className="font-medium text-foreground">
                {filteredStoreName ?? 'the selected store'}
              </span>
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">Show all</Link>
            </Button>
          </div>
        )}
        {!list ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load invoices</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : list.pagination.totalCount === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {storeId
              ? 'This store has no invoices yet.'
              : 'No invoices yet. Use Generate Invoice to create the first one.'}
          </div>
        ) : list.invoices.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No invoices on this page.{' '}
            <Link href={href(list.pagination.totalPages)} className="underline">
              Go to the last page
            </Link>
          </div>
        ) : (
          <>
            <InvoicesTable invoices={list.invoices} />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {list.pagination.page} of {list.pagination.totalPages} ·{' '}
                {list.pagination.totalCount} invoice
                {list.pagination.totalCount === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                {list.pagination.page <= 1 ? (
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={href(list.pagination.page - 1)}>Previous</Link>
                  </Button>
                )}
                {list.pagination.page >= list.pagination.totalPages ? (
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={href(list.pagination.page + 1)}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
