"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

import { EmailStatusBadge, PaymentStatusBadge } from "@/components/invoices/invoice-badges";
import { InvoiceBreakdown, planRuleText } from "@/components/invoices/invoice-breakdown";
import { ResendEmailButton } from "@/components/invoices/resend-email-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { BillingRequestError } from "@/lib/billing-client";
import {
  generateInvoiceRequest,
  invoicePdfUrl,
  previewInvoiceRequest,
} from "@/lib/invoice-client";
import { formatBillingPeriod, formatMoney2 } from "@/lib/utils";
import type {
  SuperAdminInvoiceGenerationResult,
  SuperAdminInvoiceInput,
  SuperAdminInvoicePreview,
} from "@/types/super-admin-api";

type StoreOption = { id: string; name: string };
type Stage = "input" | "preview" | "result";

// Enough history for any realistic store; the backend stays authoritative.
const MONTHS_BACK = 36;

// UX only: completed past UTC months, newest first. Admin re-validates.
function completedMonths() {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1; // current UTC month (1-12), not yet complete
  const list: { value: string; year: number; month: number; label: string }[] = [];
  for (let i = 0; i < MONTHS_BACK; i++) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    list.push({ value: `${year}-${month}`, year, month, label: formatBillingPeriod(year, month) });
  }
  return list;
}

// UX-only amount check (strings only; Admin validates precision and rules).
const validateAmount = (raw: string): string | null => {
  const value = raw.trim();
  if (value === "") return null; // defaults to 0
  if (value.startsWith("-")) return "Must not be negative.";
  if (!/^\d+(\.\d+)?$/.test(value)) return "Enter a valid number, e.g. 250 or 250.50.";
  return null;
};

interface GenerateInvoiceDialogProps {
  /** Store already known (Store detail): selection is locked. */
  store?: StoreOption;
  /** Store options for the top-level Invoices page. */
  stores?: StoreOption[] | null;
  storesError?: string;
}

export const GenerateInvoiceDialog: React.FC<GenerateInvoiceDialogProps> = ({
  store,
  stores,
  storesError,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  const [storeId, setStoreId] = useState(store?.id ?? "");
  const [monthValue, setMonthValue] = useState("");
  const [additionalCharge, setAdditionalCharge] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");

  const [preview, setPreview] = useState<SuperAdminInvoicePreview | null>(null);
  const [result, setResult] = useState<SuperAdminInvoiceGenerationResult | null>(null);

  const months = useMemo(() => (open ? completedMonths() : []), [open]);

  const chargeError = validateAmount(additionalCharge);
  const discountError = validateAmount(discount);

  const reset = () => {
    setStage("input");
    setError("");
    setShowFieldErrors(false);
    setStoreId(store?.id ?? "");
    setMonthValue("");
    setAdditionalCharge("0");
    setDiscount("0");
    setNotes("");
    setPreview(null);
    setResult(null);
  };

  const onOpenChange = (next: boolean) => {
    if (loading) return;
    if (next) {
      reset();
      setMonthValue(completedMonths()[0]?.value ?? "");
    }
    setOpen(next);
  };

  // The same submitted inputs drive both Preview and Generate. Nothing
  // calculated (fees, totals, plan, statuses) is ever sent.
  const buildInput = (): SuperAdminInvoiceInput | null => {
    const picked = months.find((m) => m.value === monthValue);
    if (!storeId || !picked) return null;
    return {
      billingMonthYear: picked.year,
      billingMonthMonth: picked.month,
      additionalCharge: additionalCharge.trim() || "0",
      discount: discount.trim() || "0",
      notes: notes.trim() || null,
    };
  };

  const alreadyExists = (e: unknown) =>
    e instanceof BillingRequestError && e.code === "INVOICE_ALREADY_EXISTS";

  const onPreview = async () => {
    if (loading) return;
    setError("");
    setShowFieldErrors(true);
    const input = buildInput();
    if (!input || chargeError || discountError) return;
    try {
      setLoading(true);
      setPreview(await previewInvoiceRequest(storeId, input));
      setStage("preview");
    } catch (e) {
      if (alreadyExists(e)) {
        setError("An invoice already exists for this Store and billing month.");
        router.refresh(); // make the existing record visible in the history
      } else {
        setError(
          e instanceof BillingRequestError ? e.message : "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = async () => {
    if (loading) return;
    const input = buildInput();
    if (!input) return;
    setError("");
    try {
      setLoading(true);
      const generated = await generateInvoiceRequest(storeId, input);
      setResult(generated);
      setStage("result");
      if (generated.delivery.status === "SENT") {
        toast.success("Invoice generated and emailed.");
      } else {
        toast("Invoice generated. Email delivery failed.", { icon: "⚠️" });
      }
      router.refresh(); // list, Store history and detail pick up the new invoice
    } catch (e) {
      if (alreadyExists(e)) {
        setError("An invoice already exists for this Store and billing month.");
        setPreview(null);
        setStage("input");
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
        <Button disabled={!store && !stores}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {stage === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
              <DialogDescription>
                Choose a completed billing month, optionally add a charge, discount or
                notes, then preview the invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="invoice-store">
                  Store
                </label>
                {store ? (
                  <p id="invoice-store" className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    {store.name}
                  </p>
                ) : (
                  <NativeSelect
                    id="invoice-store"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="" disabled>
                      Select a store…
                    </option>
                    {(stores ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
                {!store && !stores && storesError && (
                  <p className="text-sm text-destructive">{storesError}</p>
                )}
                {showFieldErrors && !storeId && (
                  <p className="text-sm text-destructive">Select a store.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="invoice-month">
                  Billing Month
                </label>
                <NativeSelect
                  id="invoice-month"
                  value={monthValue}
                  onChange={(e) => setMonthValue(e.target.value)}
                  disabled={loading}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </NativeSelect>
                <p className="text-xs text-muted-foreground">Completed months only (UTC).</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="invoice-charge">
                    Additional Charge (PKR)
                  </label>
                  <Input
                    id="invoice-charge"
                    value={additionalCharge}
                    onChange={(e) => setAdditionalCharge(e.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={loading}
                  />
                  {showFieldErrors && chargeError && (
                    <p className="text-sm text-destructive">{chargeError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="invoice-discount">
                    Discount (PKR)
                  </label>
                  <Input
                    id="invoice-discount"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={loading}
                  />
                  {showFieldErrors && discountError && (
                    <p className="text-sm text-destructive">{discountError}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="invoice-notes">
                  Notes <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  id="invoice-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={loading}
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
                Cancel
              </Button>
              <Button disabled={loading} onClick={onPreview}>
                {loading ? "Calculating…" : "Preview Invoice"}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "preview" && preview && (
          <>
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
              <DialogDescription>
                Review the calculated invoice. Final values are recalculated when the
                invoice is generated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Store</dt>
                  <dd className="font-medium">{preview.store.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Billing period</dt>
                  <dd className="font-medium">
                    {formatBillingPeriod(preview.billingMonthYear, preview.billingMonthMonth)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Billing plan</dt>
                  <dd className="font-medium">
                    {preview.billingPlan.name}
                    {preview.billingPlan.isArchived && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (archived — still assigned)
                      </span>
                    )}
                  </dd>
                  <dd className="text-muted-foreground">
                    {preview.billingPlan.type} ·{" "}
                    {planRuleText(
                      preview.billingPlan.type,
                      preview.billingPlan.fixedAmount,
                      preview.billingPlan.percentageRate,
                      preview.currency
                    )}
                  </dd>
                </div>
              </dl>
              <div className="rounded-lg border p-4">
                <InvoiceBreakdown
                  eligibleSales={preview.eligibleSales}
                  basePlatformFee={preview.basePlatformFee}
                  additionalCharge={preview.additionalCharge}
                  discount={preview.discount}
                  total={preview.total}
                  currency={preview.currency}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Expected payment status</span>
                <PaymentStatusBadge status={preview.paymentStatus} />
              </div>
              {preview.notes && (
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{preview.notes}</p>
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => {
                  setError("");
                  setPreview(null);
                  setStage("input");
                }}
              >
                Back
              </Button>
              <Button disabled={loading} onClick={onGenerate}>
                {loading ? "Generating…" : "Generate & Send"}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === "result" && result && (
          <>
            <DialogHeader>
              <DialogTitle>
                {result.delivery.status === "SENT"
                  ? "Invoice generated and emailed successfully."
                  : "Invoice generated successfully, but email delivery failed."}
              </DialogTitle>
              <DialogDescription>
                {result.delivery.status === "SENT"
                  ? "The invoice PDF was sent to the store owner."
                  : "The invoice exists and is valid. Only the email did not go out — use Resend Email; do not generate it again."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Invoice number</dt>
                  <dd className="break-all font-mono font-medium">{result.invoice.invoiceNumber}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Billing period</dt>
                  <dd className="font-medium">
                    {formatBillingPeriod(
                      result.invoice.billingMonthYear,
                      result.invoice.billingMonthMonth
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="font-medium">
                    {formatMoney2(result.invoice.total, result.invoice.currency)}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <PaymentStatusBadge status={result.invoice.paymentStatus} />
                  <EmailStatusBadge status={result.invoice.emailStatus} />
                </div>
              </dl>
              {result.delivery.status === "FAILED" && result.delivery.error && (
                <p role="alert" className="text-sm text-destructive">
                  {result.delivery.error}
                </p>
              )}
            </div>
            <DialogFooter className="flex-wrap gap-2 pt-2 sm:gap-2 sm:space-x-0">
              {result.delivery.status === "FAILED" && (
                <ResendEmailButton
                  invoiceId={result.invoice.id}
                  variant="default"
                  size="default"
                  onResult={setResult}
                />
              )}
              <Button variant="outline" asChild>
                <a href={invoicePdfUrl(result.invoice.id)}>Download PDF</a>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/invoices/${result.invoice.id}`}>View Invoice</Link>
              </Button>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
