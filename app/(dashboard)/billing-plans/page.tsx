import Link from 'next/link';

import { BillingPlanFormDialog } from '@/components/billing/billing-plan-form-dialog';
import { BillingPlanRowActions } from '@/components/billing/billing-plan-row-actions';
import {
  PlanStatusBadge,
  PlanTypeBadge,
  formatPlanRule,
} from '@/components/billing/plan-summary';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminApiError, getBillingPlans } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';
import type {
  SuperAdminBillingPlan,
  SuperAdminBillingPlanStatus,
} from '@/types/super-admin-api';

// Per-request platform data behind auth; never statically rendered.
export const dynamic = 'force-dynamic';

const FILTERS: { status: SuperAdminBillingPlanStatus; label: string }[] = [
  { status: 'all', label: 'All' },
  { status: 'active', label: 'Active' },
  { status: 'archived', label: 'Archived' },
];

const EMPTY_MESSAGE: Record<SuperAdminBillingPlanStatus, string> = {
  all: 'No billing plans yet. Create one to get started.',
  active: 'No active billing plans.',
  archived: 'No archived billing plans.',
};

const parseStatus = (
  value: string | string[] | undefined
): SuperAdminBillingPlanStatus => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'active' || raw === 'archived' ? raw : 'all';
};

const BillingPlansPage = async ({
  searchParams,
}: {
  searchParams: { status?: string | string[] };
}) => {
  const status = parseStatus(searchParams.status);
  let plans: SuperAdminBillingPlan[] | null = null;
  let errorMessage = '';

  try {
    plans = await getBillingPlans(status);
  } catch (error) {
    errorMessage =
      error instanceof AdminApiError
        ? error.message
        : 'Unexpected error while loading billing plans.';
    if (!(error instanceof AdminApiError)) {
      console.error('[BILLING_PLANS]', error);
    }
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Heading
            title="Billing Plans"
            description="Define billing plans and retire them when they are no longer offered."
          />
          <BillingPlanFormDialog />
        </div>
        <Separator />
        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((filter) => (
            <Button
              key={filter.status}
              variant={filter.status === status ? 'default' : 'outline'}
              size="sm"
              asChild
            >
              <Link
                href={
                  filter.status === 'all'
                    ? '/billing-plans'
                    : `/billing-plans?status=${filter.status}`
                }
                aria-current={filter.status === status ? 'true' : undefined}
              >
                {filter.label}
              </Link>
            </Button>
          ))}
        </div>
        {!plans ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load billing plans</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : plans.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {EMPTY_MESSAGE[status]}
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Billing rule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <PlanTypeBadge type={plan.type} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatPlanRule(plan)}
                    </TableCell>
                    <TableCell>
                      <PlanStatusBadge isArchived={plan.isArchived} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(plan.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <BillingPlanRowActions plan={plan} />
                    </TableCell>
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

export default BillingPlansPage;
