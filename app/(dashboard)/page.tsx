import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminApiError, getSuperAdminStores } from '@/lib/admin-api';
import type { SuperAdminStore } from '@/types/super-admin-api';

// Per-request platform data behind auth; never statically rendered.
export const dynamic = 'force-dynamic';

// Temporary proof of the Super Admin -> Admin privileged API path.
// The real Store overview replaces this.
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

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Dashboard" description="Platform overview" />
        <Separator />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {stores ? 'Platform API connected' : 'Platform API unavailable'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {stores ? (
              <>
                <p>Stores: {stores.length}</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {stores.map((store) => (
                    <li key={store.id}>{store.name}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-destructive">{errorMessage}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
