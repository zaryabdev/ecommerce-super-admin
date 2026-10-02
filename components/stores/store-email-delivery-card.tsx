"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  updateStoreEmailSettingsRequest,
} from "@/lib/billing-client";

interface StoreEmailDeliveryCardProps {
  storeId: string;
  /** The Store's current setting, as returned by Admin. */
  blocked: boolean;
}

// Same Store.emailDeliveryBlocked field the merchant controls in Admin. Admin
// enforces it server-side before every send; this card only flips the field.
export const StoreEmailDeliveryCard = ({
  storeId,
  blocked,
}: StoreEmailDeliveryCardProps) => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = async (emailDeliveryBlocked: boolean) => {
    if (loading) return;
    try {
      setLoading(true);
      await updateStoreEmailSettingsRequest(storeId, emailDeliveryBlocked);
      toast.success(
        emailDeliveryBlocked
          ? "All email is now blocked for this Store."
          : "Email is now allowed for this Store."
      );
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <CardTitle className="text-base">Email delivery</CardTitle>
        <Badge variant={blocked ? "destructive" : "default"} className="shrink-0">
          {blocked ? "Blocked" : "Active"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Blocks all Storvia-generated email for this Store, including new-order
          notifications and invoice emails. Orders and invoices will continue to
          work normally.
        </p>
        {blocked ? (
          <Button variant="outline" disabled={loading} onClick={() => update(false)}>
            {loading ? "Saving…" : "Allow all email"}
          </Button>
        ) : (
          <Button
            variant="destructive"
            disabled={loading}
            onClick={() => setConfirmOpen(true)}
          >
            Block all email
          </Button>
        )}
      </CardContent>
      <Dialog open={confirmOpen} onOpenChange={(open) => !loading && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block all email?</DialogTitle>
            <DialogDescription>
              Storvia will stop sending new-order notifications, invoice emails,
              and other Store email until email is allowed again. Orders and
              invoices will continue to work normally.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 sm:space-x-0">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" disabled={loading} onClick={() => update(true)}>
              {loading ? "Saving…" : "Block all email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
