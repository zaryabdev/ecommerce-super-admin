import Link from 'next/link';

import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminApiError, getSuperAdminStore } from '@/lib/admin-api';
import { formatDate, formatMoney } from '@/lib/utils';
import type { SuperAdminStoreDetail } from '@/types/super-admin-api';

// Per-request platform data behind auth; never statically rendered.
export const dynamic = 'force-dynamic';

const BackLink = () => (
  <Link
    href="/stores"
    className="text-sm text-muted-foreground hover:text-primary"
  >
    ← Back to stores
  </Link>
);

const StoreDetailPage = async ({ params }: { params: { storeId: string } }) => {
  let store: SuperAdminStoreDetail | null = null;
  let notFound = false;
  let errorMessage = '';

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
      </div>
    </div>
  );
};

export default StoreDetailPage;
