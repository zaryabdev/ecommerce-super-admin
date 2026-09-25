import Link from 'next/link';

import { EmailStatusBadge, PaymentStatusBadge } from '@/components/invoices/invoice-badges';
import { InvoiceBreakdown, planRuleText } from '@/components/invoices/invoice-breakdown';
import { ResendEmailButton } from '@/components/invoices/resend-email-button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminApiError, getInvoice } from '@/lib/admin-api';
import { invoicePdfUrl } from '@/lib/invoice-client';
import { formatBillingPeriod, formatDate, formatDateTime } from '@/lib/utils';
import type { SuperAdminInvoiceDetail } from '@/types/super-admin-api';

// Per-request platform data behind auth; never statically rendered.
export const dynamic = 'force-dynamic';

const BackLink = () => (
  <Link href="/invoices" className="text-sm text-muted-foreground hover:text-primary">
    ← Back to invoices
  </Link>
);

const InvoiceDetailPage = async ({ params }: { params: { invoiceId: string } }) => {
  let invoice: SuperAdminInvoiceDetail | null = null;
  let notFound = false;
  let errorMessage = '';

  try {
    invoice = await getInvoice(params.invoiceId);
  } catch (error) {
    if (error instanceof AdminApiError) {
      notFound = error.kind === 'not_found';
      errorMessage = error.message;
    } else {
      errorMessage = 'Unexpected error while loading the invoice.';
      console.error('[INVOICE_DETAIL]', error);
    }
  }

  if (!invoice) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <BackLink />
          {notFound ? (
            <>
              <Heading title="Invoice not found" description="This invoice does not exist." />
              <Separator />
            </>
          ) : (
            <>
              <Heading title="Invoice" description="Invoice detail" />
              <Separator />
              <Alert variant="destructive">
                <AlertTitle>Could not load invoice</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </div>
    );
  }

  const period = formatBillingPeriod(invoice.billingMonthYear, invoice.billingMonthMonth);
  const field = (label: string, value: React.ReactNode) => (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BackLink />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Heading title={invoice.invoiceNumber} description={`${invoice.store.name} · ${period}`} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={invoicePdfUrl(invoice.id)}>Download PDF</a>
            </Button>
            <Button variant="outline" asChild>
              <a href={invoicePdfUrl(invoice.id, true)} target="_blank" rel="noreferrer">
                Open PDF
              </a>
            </Button>
            <ResendEmailButton invoiceId={invoice.id} variant="default" size="default" />
          </div>
        </div>
        <Separator />

        {invoice.emailStatus === 'FAILED' && (
          <Alert variant="destructive">
            <AlertTitle>The invoice exists, but the last email attempt failed</AlertTitle>
            <AlertDescription>
              {invoice.emailError ?? 'Email delivery failed.'} Use Resend Email — do not
              generate this invoice again.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                {field('Invoice number', <span className="break-all font-mono">{invoice.invoiceNumber}</span>)}
                {field(
                  'Store',
                  <Link href={`/stores/${invoice.store.id}`} className="hover:underline">
                    {invoice.store.name}
                  </Link>
                )}
                {field('Billing period', period)}
                {field('Invoice date', formatDate(invoice.invoiceDate))}
                {field('Due date', formatDate(invoice.dueDate))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                {field('Payment status', <PaymentStatusBadge status={invoice.paymentStatus} />)}
                {field('Email status', <EmailStatusBadge status={invoice.emailStatus} />)}
                {field('Email attempts', invoice.emailAttemptCount)}
                {field('Last email attempt', formatDateTime(invoice.lastEmailAttemptAt))}
                {field('Last successful email', formatDateTime(invoice.emailSentAt))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing plan (snapshot)</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                {field('Plan', invoice.billingPlanName)}
                {field('Type', <Badge variant="outline">{invoice.billingPlanType}</Badge>)}
                {field(
                  'Rule',
                  planRuleText(
                    invoice.billingPlanType,
                    invoice.fixedAmount,
                    invoice.percentageRate,
                    invoice.currency
                  )
                )}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceBreakdown
                eligibleSales={invoice.eligibleSales}
                basePlatformFee={invoice.basePlatformFee}
                additionalCharge={invoice.additionalCharge}
                discount={invoice.discount}
                total={invoice.total}
                currency={invoice.currency}
              />
            </CardContent>
          </Card>
        </div>

        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetailPage;
