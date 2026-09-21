import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardPage = () => {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Dashboard" description="Platform overview" />
        <Separator />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Foundation ready</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Store listing, sales metrics and billing will appear here once
            Admin&apos;s privileged API exists. No platform data is loaded yet.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
