import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import type { SuperAdminBillingPlan } from "@/types/super-admin-api";

// Billing plans are configured in PKR. Values stay decimal strings end to end.
const PLAN_CURRENCY = "PKR";

// Text form of the billing rule. The percentage value is shown exactly as
// stored: its unit (whole points vs fraction) is intentionally undecided, so no
// conversion, scaling or "%" suffix is applied.
export function formatPlanRule(plan: SuperAdminBillingPlan): string {
  if (plan.type === "FIXED") {
    return plan.fixedAmount === null
      ? "—"
      : formatMoney(plan.fixedAmount, PLAN_CURRENCY);
  }
  return plan.percentageRate === null ? "—" : `Rate ${plan.percentageRate}`;
}

export const PlanTypeBadge = ({ type }: { type: SuperAdminBillingPlan["type"] }) => (
  <Badge variant="outline">{type}</Badge>
);

export const PlanStatusBadge = ({ isArchived }: { isArchived: boolean }) => (
  <Badge variant={isArchived ? "secondary" : "default"}>
    {isArchived ? "Archived" : "Active"}
  </Badge>
);
