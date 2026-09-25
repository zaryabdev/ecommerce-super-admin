import { Badge } from "@/components/ui/badge";
import type {
  SuperAdminInvoiceEmailStatus,
  SuperAdminInvoicePaymentStatus,
} from "@/types/super-admin-api";

export const PaymentStatusBadge = ({
  status,
}: {
  status: SuperAdminInvoicePaymentStatus;
}) => (
  <Badge variant={status === "PAID" ? "default" : "outline"}>{status}</Badge>
);

// FAILED describes only the email: the Invoice itself was created.
export const EmailStatusBadge = ({
  status,
}: {
  status: SuperAdminInvoiceEmailStatus;
}) => (
  <Badge
    variant={
      status === "SENT" ? "default" : status === "FAILED" ? "destructive" : "secondary"
    }
    title={status === "FAILED" ? "The invoice exists; only email delivery failed." : undefined}
  >
    {status === "NOT_SENT" ? "NOT SENT" : status}
  </Badge>
);
