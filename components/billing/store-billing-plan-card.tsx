"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  PlanStatusBadge,
  PlanTypeBadge,
  formatPlanRule,
} from "@/components/billing/plan-summary";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import {
  BillingRequestError,
  updateStoreBillingPlanRequest,
} from "@/lib/billing-client";
import type {
  SuperAdminBillingPlan,
  SuperAdminStoreBillingPlan,
} from "@/types/super-admin-api";

interface StoreBillingPlanCardProps {
  storeId: string;
  /** Null when the assignment could not be loaded (see assignmentError). */
  assignment: SuperAdminStoreBillingPlan | null;
  assignmentError: string;
  /** Active plans only — archived plans are never offered for new assignment. */
  activePlans: SuperAdminBillingPlan[] | null;
  plansError: string;
}

export const StoreBillingPlanCard: React.FC<StoreBillingPlanCardProps> = ({
  storeId,
  assignment,
  assignmentError,
  activePlans,
  plansError,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [serverError, setServerError] = useState("");

  const current = assignment?.billingPlan ?? null;

  const save = async (billingPlanId: string | null, done: () => void) => {
    if (loading) return;
    setServerError("");
    try {
      setLoading(true);
      await updateStoreBillingPlanRequest(storeId, billingPlanId);
      toast.success(
        billingPlanId ? "Billing plan assigned." : "Billing plan unassigned."
      );
      done();
      router.refresh();
    } catch (error) {
      setServerError(
        error instanceof BillingRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openAssign = () => {
    // Preselect the current plan only when it is still assignable (active).
    setSelectedPlanId(current && !current.isArchived ? current.id : "");
    setServerError("");
    setAssignOpen(true);
  };

  const openUnassign = () => {
    setServerError("");
    setUnassignOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Billing Plan</CardTitle>
        {assignment && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openAssign}>
              {current ? "Change plan" : "Assign plan"}
            </Button>
            {current && (
              <Button variant="secondary" size="sm" onClick={openUnassign}>
                Unassign
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!assignment ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load billing plan</AlertTitle>
            <AlertDescription>{assignmentError}</AlertDescription>
          </Alert>
        ) : !current ? (
          <p className="text-sm text-muted-foreground">
            No billing plan assigned.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{current.name}</span>
              <PlanTypeBadge type={current.type} />
              <PlanStatusBadge isArchived={current.isArchived} />
            </div>
            <div className="text-sm tabular-nums">{formatPlanRule(current)}</div>
            {current.isArchived && (
              <p className="text-sm text-muted-foreground">
                This plan is archived. It stays assigned until you change or
                unassign it.
              </p>
            )}
          </div>
        )}
      </CardContent>

      <Dialog
        open={assignOpen}
        onOpenChange={(next) => !loading && setAssignOpen(next)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{current ? "Change billing plan" : "Assign billing plan"}</DialogTitle>
            <DialogDescription>
              Only active plans can be assigned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {!activePlans ? (
              <p role="alert" className="text-sm text-destructive">
                {plansError || "Could not load billing plans."}
              </p>
            ) : activePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                There are no active billing plans.{" "}
                <Link href="/billing-plans" className="underline">
                  Create one
                </Link>
                .
              </p>
            ) : (
              <>
                <label htmlFor="store-billing-plan" className="text-sm font-medium">
                  Billing plan
                </label>
                <NativeSelect
                  id="store-billing-plan"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  disabled={loading}
                >
                  <option value="" disabled>
                    Select a plan…
                  </option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · {plan.type} · {formatPlanRule(plan)}
                    </option>
                  ))}
                </NativeSelect>
              </>
            )}
            {serverError && (
              <p role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                loading || !selectedPlanId || selectedPlanId === current?.id
              }
              onClick={() => save(selectedPlanId, () => setAssignOpen(false))}
            >
              {loading ? "Saving…" : "Assign plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unassignOpen}
        onOpenChange={(next) => !loading && setUnassignOpen(next)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassign billing plan?</DialogTitle>
            <DialogDescription>
              This store will have no billing plan
              {current ? ` (currently “${current.name}”)` : ""}. You can assign
              a plan again at any time.
            </DialogDescription>
          </DialogHeader>
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setUnassignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={() => save(null, () => setUnassignOpen(false))}
            >
              {loading ? "Saving…" : "Unassign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
