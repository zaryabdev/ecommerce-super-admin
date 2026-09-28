import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney2 } from "@/lib/utils";
import type { SuperAdminFinancialLedgerEntry } from "@/types/super-admin-api";

// Newest first, as sent by Admin. Both Invoice and Payment rows reference the
// same Invoice Number and link to the invoice detail page.
export const LedgerTable = ({
  entries,
  currency,
}: {
  entries: SuperAdminFinancialLedgerEntry[];
  currency: string;
}) => (
  <div className="rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead className="text-right">Debit</TableHead>
          <TableHead className="text-right">Credit</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={`${entry.type}-${entry.sourceId}`}>
            <TableCell className="whitespace-nowrap">{formatDate(entry.date)}</TableCell>
            <TableCell>
              <Badge variant={entry.type === "INVOICE" ? "outline" : "default"}>
                {entry.type === "INVOICE" ? "Invoice" : "Payment"}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap font-mono text-xs">
              <Link href={`/invoices/${entry.invoiceId}`} className="hover:underline">
                {entry.invoiceNumber}
              </Link>
            </TableCell>
            <TableCell className="whitespace-nowrap text-right tabular-nums">
              {entry.debit !== null ? formatMoney2(entry.debit, currency) : "—"}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right tabular-nums">
              {entry.credit !== null ? formatMoney2(entry.credit, currency) : "—"}
            </TableCell>
            <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
              {formatMoney2(entry.balance, currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
