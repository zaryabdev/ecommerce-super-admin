import Link from "next/link";

import { EmailStatusBadge, PaymentStatusBadge } from "@/components/invoices/invoice-badges";
import { ResendEmailButton } from "@/components/invoices/resend-email-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invoicePdfUrl } from "@/lib/invoice-client";
import { formatBillingPeriod, formatDate, formatMoney2 } from "@/lib/utils";
import type { SuperAdminInvoiceListItem } from "@/types/super-admin-api";

export const InvoicesTable = ({
  invoices,
  showStore = true,
}: {
  invoices: SuperAdminInvoiceListItem[];
  showStore?: boolean;
}) => (
  <div className="rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          {showStore && <TableHead>Store</TableHead>}
          <TableHead>Billing Period</TableHead>
          <TableHead>Invoice Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="whitespace-nowrap font-mono text-xs">
              <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                {invoice.invoiceNumber}
              </Link>
            </TableCell>
            {showStore && (
              <TableCell className="font-medium">
                <Link href={`/stores/${invoice.storeId}`} className="hover:underline">
                  {invoice.storeName}
                </Link>
              </TableCell>
            )}
            <TableCell className="whitespace-nowrap">
              {formatBillingPeriod(invoice.billingMonthYear, invoice.billingMonthMonth)}
            </TableCell>
            <TableCell className="whitespace-nowrap">{formatDate(invoice.invoiceDate)}</TableCell>
            <TableCell className="whitespace-nowrap text-right tabular-nums">
              {formatMoney2(invoice.total, invoice.currency)}
            </TableCell>
            <TableCell>
              <PaymentStatusBadge status={invoice.paymentStatus} />
            </TableCell>
            <TableCell>
              <EmailStatusBadge status={invoice.emailStatus} />
              {invoice.emailStatus === "FAILED" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Invoice created — email failed
                </p>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/invoices/${invoice.id}`}>View</Link>
                </Button>
                {/* Plain anchor: a same-origin file route must not be prefetched. */}
                <Button variant="outline" size="sm" asChild>
                  <a href={invoicePdfUrl(invoice.id)}>Download PDF</a>
                </Button>
                <ResendEmailButton invoiceId={invoice.id} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
