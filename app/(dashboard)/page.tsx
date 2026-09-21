import Link from 'next/link';

import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminApiError, getSuperAdminStores } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';
import type { SuperAdminStore } from '@/types/super-admin-api';

// Per-request platform data behind auth; never statically rendered.
export const dynamic = 'force-dynamic';

const RECENT_STORES_LIMIT = 5;

const DashboardPage = async () => {
  let stores: SuperAdminStore[] | null = null;
  let errorMessage = '';

  try {
    stores = await getSuperAdminStores();
  } catch (error) {
    errorMessage =
      error instanceof AdminApiError
        ? error.message
        : 'Unexpected error while loading platform data.';
    if (!(error instanceof AdminApiError)) {
      console.error('[DASHBOARD]', error);
    }
  }

  // Sales are intentionally not summed: Stores may use different currencies.
  const totalOrders = stores?.reduce((sum, store) => sum + store.orderCount, 0);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Dashboard" description="Platform overview" />
        <Separator />
        {!stores ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load platform data</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Stores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stores.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                </CardContent>
              </Card>
            </div>
            {stores.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Recent Stores</CardTitle>
                  <Link
                    href="/stores"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    View all
                  </Link>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y text-sm">
                    {stores.slice(0, RECENT_STORES_LIMIT).map((store) => (
                      <li
                        key={store.id}
                        className="flex items-center justify-between gap-4 py-2"
                      >
                        <span className="font-medium">{store.name}</span>
                        <span className="whitespace-nowrap text-muted-foreground">
                          {formatDate(store.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
