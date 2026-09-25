import { formatMoney2 } from "@/lib/utils";
import type { SuperAdminBillingPlanType } from "@/types/super-admin-api";

// Presentation of already-calculated values only (Admin owns the maths).
export const planRuleText = (
  type: SuperAdminBillingPlanType,
  fixedAmount: string | null,
  percentageRate: string | null,
  currency = "PKR"
) =>
  type === "FIXED"
    ? fixedAmount === null
      ? "—"
      : `Fixed amount ${formatMoney2(fixedAmount, currency)}`
    : percentageRate === null
      ? "—"
      : // Stored in percentage points: "2.5" means 2.5%.
        `${percentageRate}% of eligible sales`;

interface InvoiceBreakdownProps {
  eligibleSales: string;
  basePlatformFee: string;
  additionalCharge: string;
  discount: string;
  total: string;
  currency: string;
}

export const InvoiceBreakdown = ({
  eligibleSales,
  basePlatformFee,
  additionalCharge,
  discount,
  total,
  currency,
}: InvoiceBreakdownProps) => {
  const row = (label: string, value: string, muted = false) => (
    <div className="flex justify-between gap-4">
      <dt className={muted ? "text-muted-foreground" : ""}>{label}</dt>
      <dd className={`tabular-nums ${muted ? "text-muted-foreground" : ""}`}>{value}</dd>
    </div>
  );
  return (
    <dl className="space-y-2 text-sm">
      {row("Eligible sales (informational)", formatMoney2(eligibleSales, currency), true)}
      {row("Base platform fee", formatMoney2(basePlatformFee, currency))}
      {row("Additional charge", formatMoney2(additionalCharge, currency))}
      {row("Discount", discount === "0" ? formatMoney2("0", currency) : `- ${formatMoney2(discount, currency)}`)}
      <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatMoney2(total, currency)}</dd>
      </div>
    </dl>
  );
};
