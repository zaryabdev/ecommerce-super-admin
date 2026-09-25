"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button, type ButtonProps } from "@/components/ui/button";
import { BillingRequestError } from "@/lib/billing-client";
import { resendInvoiceEmailRequest } from "@/lib/invoice-client";
import type { SuperAdminInvoiceGenerationResult } from "@/types/super-admin-api";

interface ResendEmailButtonProps {
  invoiceId: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  /** Called with the updated invoice + delivery result (success or failure). */
  onResult?: (result: SuperAdminInvoiceGenerationResult) => void;
}

// Resend Email works for NOT_SENT, FAILED and SENT invoices. A failed resend is
// a normal outcome (the invoice stays); the button stays available.
export const ResendEmailButton = ({
  invoiceId,
  variant = "outline",
  size = "sm",
  onResult,
}: ResendEmailButtonProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const result = await resendInvoiceEmailRequest(invoiceId);
      if (result.delivery.status === "SENT") {
        toast.success("Invoice email sent.");
      } else {
        toast.error(
          `Email delivery failed${result.delivery.error ? `: ${result.delivery.error}` : "."}`
        );
      }
      onResult?.(result);
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
    <Button variant={variant} size={size} disabled={loading} onClick={onClick}>
      {loading ? "Sending…" : "Resend Email"}
    </Button>
  );
};
