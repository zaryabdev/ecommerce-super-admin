"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BillingRequestError } from "@/lib/billing-client";
import { markInvoicePaidRequest } from "@/lib/invoice-client";
import { formatBillingPeriod, formatMoney2 } from "@/lib/utils";
import type { SuperAdminMarkPaidResult } from "@/types/super-admin-api";

interface MarkPaidDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  storeName: string;
  /** Decimal string; always the full stored Invoice total (read-only here). */
  total: string;
  currency: string;
  billingMonthYear?: number;
  billingMonthMonth?: number;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  onResult?: (result: SuperAdminMarkPaidResult) => void;
}

// Full-payment-only Release 1: the only client input is Notes. Amount is
// always the stored Invoice total, shown read-only, never editable here.
export const MarkPaidDialog = ({
  invoiceId,
  invoiceNumber,
  storeName,
  total,
  currency,
  billingMonthYear,
  billingMonthMonth,
  variant = "outline",
  size = "sm",
  onResult,
}: MarkPaidDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  // Set when another request won the race: the dialog stops offering retry
  // and just reflects the now-refreshed real state.
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  const period =
    billingMonthYear && billingMonthMonth
      ? formatBillingPeriod(billingMonthYear, billingMonthMonth)
      : null;

  const reset = () => {
    setNotes("");
    setError("");
    setAlreadyPaid(false);
  };

  const onOpenChange = (next: boolean) => {
    if (loading) return;
    if (next) reset();
    setOpen(next);
  };

  const onSubmit = async () => {
    if (loading) return;
    setError("");
    try {
      setLoading(true);
      const result = await markInvoicePaidRequest(invoiceId, {
        notes: notes.trim() || null,
      });
      toast.success("Invoice marked as paid.");
      onResult?.(result);
      router.refresh();
      setOpen(false);
    } catch (e) {
      if (e instanceof BillingRequestError && e.code === "INVOICE_ALREADY_PAID") {
        setAlreadyPaid(true);
        setError(e.message);
        router.refresh();
      } else {
        setError(
          e instanceof BillingRequestError ? e.message : "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          Mark Paid
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark invoice as paid</DialogTitle>
          <DialogDescription>
            Records a full payment for this invoice using its total below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Invoice number</dt>
              <dd className="break-all font-mono font-medium">{invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Store</dt>
              <dd className="font-medium">{storeName}</dd>
            </div>
            {period && (
              <div>
                <dt className="text-muted-foreground">Billing period</dt>
                <dd className="font-medium">{period}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium">{formatMoney2(total, currency)}</dd>
            </div>
          </dl>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="mark-paid-notes">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="mark-paid-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading || alreadyPaid}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 pt-2 sm:gap-0">
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            {alreadyPaid ? "Close" : "Cancel"}
          </Button>
          {!alreadyPaid && (
            <Button disabled={loading} onClick={onSubmit}>
              {loading ? "Recording…" : "Mark Paid"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
