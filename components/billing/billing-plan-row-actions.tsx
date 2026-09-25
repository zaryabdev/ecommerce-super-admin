"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { BillingPlanFormDialog } from "@/components/billing/billing-plan-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BillingRequestError,
  updateBillingPlanRequest,
} from "@/lib/billing-client";
import type { SuperAdminBillingPlan } from "@/types/super-admin-api";

export const BillingPlanRowActions = ({
  plan,
}: {
  plan: SuperAdminBillingPlan;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setArchived = async (isArchived: boolean) => {
    if (loading) return;
    try {
      setLoading(true);
      await updateBillingPlanRequest(plan.id, { isArchived });
      toast.success(isArchived ? "Billing plan archived." : "Billing plan restored.");
      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof BillingRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <BillingPlanFormDialog plan={plan} />
      {plan.isArchived ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => setArchived(false)}
        >
          {loading ? "Restoring…" : "Restore"}
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => setConfirmOpen(true)}
        >
          Archive
        </Button>
      )}
      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => !loading && setConfirmOpen(next)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive “{plan.name}”?</DialogTitle>
            <DialogDescription>
              Archived plans can no longer be assigned to new stores. Stores
              already on this plan keep it, and you can restore the plan at any
              time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={loading} onClick={() => setArchived(true)}>
              {loading ? "Archiving…" : "Archive plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
