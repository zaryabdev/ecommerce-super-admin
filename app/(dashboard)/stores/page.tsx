import Link from 'next/link';

import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminApiError, getSuperAdminStores } from '@/lib/admin-api';
import { formatDate, formatMoney } from '@/lib/utils';
import type { SuperAdminStore } from '@/types/super-admin-api';

// Per-request platform data behind auth; never statically rendered.
export const dynamic = 'force-dynamic';

const StoresPage = async () => {
  let stores: SuperAdminStore[] | null = null;
  let errorMessage = '';

  try {
    stores = await getSuperAdminStores();
  } catch (error) {
    errorMessage =
      error instanceof AdminApiError
        ? error.message
        : 'Unexpected error while loading stores.';
    if (!(error instanceof AdminApiError)) {
      console.error('[STORES]', error);
    }
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading
          title="Stores"
          description="Manage and review stores across the platform."
        />
        <Separator />
        {!stores ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load stores</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : stores.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No stores yet.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/stores/${store.id}`}
                        className="hover:underline"
                      >
                        {store.name}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(store.createdAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {store.orderCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatMoney(store.salesTotal, store.currency)}
                    </TableCell>
                    <TableCell>{store.currency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoresPage;
