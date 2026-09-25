"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, Plus } from "lucide-react";

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
import {
  BillingRequestError,
  createBillingPlanRequest,
  updateBillingPlanRequest,
} from "@/lib/billing-client";
import type {
  SuperAdminBillingPlan,
  SuperAdminBillingPlanType,
} from "@/types/super-admin-api";

// UX-only checks; Admin remains the authority (precision, ranges, exclusivity).
// Values stay strings so no float ever touches a financial figure.
const validateValue = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return "A value is required.";
  if (value.startsWith("-")) return "Value must not be negative.";
  if (!/^\d+(\.\d+)?$/.test(value)) return "Enter a valid number, e.g. 1500 or 2.5.";
  return null;
};

const VALUE_FIELD: Record<
  SuperAdminBillingPlanType,
  { label: string; placeholder: string }
> = {
  FIXED: { label: "Fixed Amount (PKR)", placeholder: "e.g. 5000" },
  PERCENTAGE: { label: "Percentage Rate", placeholder: "e.g. 2.5" },
};

interface BillingPlanFormDialogProps {
  /** Omit to create a new plan; pass a plan to edit it. */
  plan?: SuperAdminBillingPlan;
}

export const BillingPlanFormDialog: React.FC<BillingPlanFormDialogProps> = ({
  plan,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<SuperAdminBillingPlanType>("FIXED");
  // One value per type so switching type never carries a value across units.
  const [fixedAmount, setFixedAmount] = useState("");
  const [percentageRate, setPercentageRate] = useState("");
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [serverError, setServerError] = useState("");

  const value = type === "FIXED" ? fixedAmount : percentageRate;
  const setValue = type === "FIXED" ? setFixedAmount : setPercentageRate;
  const nameError = name.trim() ? null : "Name is required.";
  const valueError = validateValue(value);

  const hydrate = () => {
    setName(plan?.name ?? "");
    setType(plan?.type ?? "FIXED");
    setFixedAmount(plan?.fixedAmount ?? "");
    setPercentageRate(plan?.percentageRate ?? "");
    setShowFieldErrors(false);
    setServerError("");
  };

  const onOpenChange = (next: boolean) => {
    if (loading) return;
    if (next) hydrate();
    setOpen(next);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setServerError("");
    if (nameError || valueError) {
      setShowFieldErrors(true);
      return;
    }

    // Explicit about both fields so the backend never has to guess the intent
    // when the type changes: the inactive rule value is cleared with null.
    const payload = {
      name: name.trim(),
      type,
      fixedAmount: type === "FIXED" ? fixedAmount.trim() : null,
      percentageRate: type === "PERCENTAGE" ? percentageRate.trim() : null,
    };

    try {
      setLoading(true);
      if (plan) {
        await updateBillingPlanRequest(plan.id, payload);
        toast.success("Billing plan updated.");
      } else {
        await createBillingPlanRequest(payload);
        toast.success("Billing plan created.");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      // Keep the dialog open with the user's input intact.
      setServerError(
        error instanceof BillingRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const field = VALUE_FIELD[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {plan ? (
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Billing Plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {plan ? "Edit Billing Plan" : "Create Billing Plan"}
          </DialogTitle>
          <DialogDescription>
            {plan
              ? "Update this plan's name or billing rule."
              : "Define a billing rule that can be assigned to stores."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="billing-plan-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="billing-plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="e.g. Standard Monthly"
              maxLength={255}
              autoComplete="off"
            />
            {showFieldErrors && nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="billing-plan-type" className="text-sm font-medium">
              Type
            </label>
            <NativeSelect
              id="billing-plan-type"
              value={type}
              onChange={(e) => setType(e.target.value as SuperAdminBillingPlanType)}
              disabled={loading}
            >
              <option value="FIXED">FIXED</option>
              <option value="PERCENTAGE">PERCENTAGE</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <label htmlFor="billing-plan-value" className="text-sm font-medium">
              {field.label}
            </label>
            <Input
              id="billing-plan-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
              placeholder={field.placeholder}
              inputMode="decimal"
              autoComplete="off"
            />
            {showFieldErrors && valueError && (
              <p className="text-sm text-destructive">{valueError}</p>
            )}
          </div>
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : plan ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
