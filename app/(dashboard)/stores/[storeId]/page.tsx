import Link from 'next/link';

import { StoreBillingPlanCard } from '@/components/billing/store-billing-plan-card';
import { StoreInvoicesCard } from '@/components/invoices/store-invoices-card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AdminApiError,
  getBillingPlans,
  getInvoices,
  getStoreBillingPlan,
  getSuperAdminStore,
  getSuperAdminStoreOrders,
} from '@/lib/admin-api';
import { formatDate, formatMoney } from '@/lib/utils';
import type {
  SuperAdminBillingPlan,
  SuperAdminInvoiceListResponse,
  SuperAdminOrderStatus,
  SuperAdminStoreBillingPlan,
  SuperAdminStoreDetail,
  SuperAdminStoreOrdersResponse,
} from '@/types/super-admin-api';

// Per-request platform data behind auth; never statically rendered.
export const dynamic = 'force-dynamic';

const ORDERS_PAGE_SIZE = 20;

const statusVariant: Record<
  SuperAdminOrderStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DRAFT: 'secondary',
  CONFIRMED: 'outline',
  DELIVERED: 'default',
  CANCELED: 'destructive',
};

const parsePage = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
};

// Runs an independent Admin call so a failure only degrades its own section.
const settle = <T,>(tag: string, promise: Promise<T>, fallback: string) =>
  promise.then(
    (data) => ({ data, error: '' }),
    (error: unknown) => {
      if (!(error instanceof AdminApiError)) console.error(tag, error);
      return {
        data: null as T | null,
        error: error instanceof AdminApiError ? error.message : fallback,
      };
    }
  );

const BackLink = () => (
  <Link
    href="/stores"
    className="text-sm text-muted-foreground hover:text-primary"
  >
    ← Back to stores
  </Link>
);

const StoreDetailPage = async ({
  params,
  searchParams,
}: {
  params: { storeId: string };
  searchParams: { page?: string | string[] };
}) => {
  const requestedPage = parsePage(searchParams.page);
  let store: SuperAdminStoreDetail | null = null;
  let notFound = false;
  let errorMessage = '';

  // Orders fail independently so the rest of the detail stays usable.
  const ordersPromise = getSuperAdminStoreOrders(
    params.storeId,
    requestedPage,
    ORDERS_PAGE_SIZE
  ).then(
    (data) => ({ data, error: '' }),
    (error: unknown) => {
      if (!(error instanceof AdminApiError)) {
        console.error('[STORE_DETAIL_ORDERS]', error);
      }
      return {
        data: null as SuperAdminStoreOrdersResponse | null,
        error:
          error instanceof AdminApiError
            ? error.message
            : 'Unexpected error while loading orders.',
      };
    }
  );

  const assignmentPromise = settle<SuperAdminStoreBillingPlan>(
    '[STORE_DETAIL_BILLING_PLAN]',
    getStoreBillingPlan(params.storeId),
    'Unexpected error while loading the billing plan.'
  );
  // Only active plans are offered for a new assignment.
  const activePlansPromise = settle<SuperAdminBillingPlan[]>(
    '[STORE_DETAIL_ACTIVE_PLANS]',
    getBillingPlans('active'),
    'Unexpected error while loading billing plans.'
  );

  const invoicesPromise = settle<SuperAdminInvoiceListResponse>(
    '[STORE_DETAIL_INVOICES]',
    getInvoices({ storeId: params.storeId, page: 1, pageSize: 10 }),
    'Unexpected error while loading invoices.'
  );

  try {
    store = await getSuperAdminStore(params.storeId);
  } catch (error) {
    if (error instanceof AdminApiError) {
      notFound = error.kind === 'not_found';
      errorMessage = error.message;
    } else {
      errorMessage = 'Unexpected error while loading the store.';
      console.error('[STORE_DETAIL]', error);
    }
  }

  if (!store) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <BackLink />
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
              <Heading title="Store" description="Store detail" />
              <Separator />
              <Alert variant="destructive">
                <AlertTitle>Could not load store</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </div>
    );
  }

  const { data: ordersData, error: ordersError } = await ordersPromise;
  const { data: assignment, error: assignmentError } = await assignmentPromise;
  const { data: activePlans, error: plansError } = await activePlansPromise;
  const { data: invoicesData, error: invoicesError } = await invoicesPromise;
  const { owner } = store;
  const ownerName =
    [owner.firstName, owner.lastName].filter(Boolean).join(' ') || '—';

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BackLink />
        <Heading
          title={store.name}
          description={`Created ${formatDate(store.createdAt)}`}
        />
        <Separator />
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.orderCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMoney(store.salesTotal, store.currency)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{store.currency}</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Store</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Store ID</dt>
                  <dd className="break-all font-mono">{store.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatDate(store.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{ownerName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-all">{owner.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Clerk user ID</dt>
                  <dd className="break-all font-mono">{owner.userId}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
        <StoreBillingPlanCard
          storeId={store.id}
          assignment={assignment}
          assignmentError={assignmentError}
          activePlans={activePlans}
          plansError={plansError}
        />
        <StoreInvoicesCard
          store={{ id: store.id, name: store.name }}
          invoices={invoicesData}
          error={invoicesError}
        />
        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-semibold tracking-tight">Orders</h3>
          {!ordersData ? (
            <Alert variant="destructive">
              <AlertTitle>Could not load orders</AlertTitle>
              <AlertDescription>{ordersError}</AlertDescription>
            </Alert>
          ) : ordersData.pagination.totalCount === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              This store has no orders yet.
            </div>
          ) : ordersData.orders.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No orders on this page.{' '}
              <Link
                href={`/stores/${store.id}?page=${ordersData.pagination.totalPages}`}
                className="underline"
              >
                Go to the last page
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="whitespace-nowrap font-mono">
                          {order.trackingId}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[order.status]}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {order.itemCount}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                          {formatMoney(order.total, order.currency)}
                        </TableCell>
                        <TableCell>{order.paymentMethod}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Page {ordersData.pagination.page} of{' '}
                  {ordersData.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  {ordersData.pagination.page <= 1 ? (
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/stores/${store.id}?page=${ordersData.pagination.page - 1}`}
                      >
                        Previous
                      </Link>
                    </Button>
                  )}
                  {ordersData.pagination.page >=
                  ordersData.pagination.totalPages ? (
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/stores/${store.id}?page=${ordersData.pagination.page + 1}`}
                      >
                        Next
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDetailPage;
