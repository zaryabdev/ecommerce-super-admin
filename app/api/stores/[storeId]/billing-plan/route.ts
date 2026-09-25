import { updateStoreBillingPlan } from "@/lib/admin-api";
import {
  handleAdminMutation,
  invalidBody,
  readJsonObject,
} from "@/lib/admin-mutation";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const body = await readJsonObject(req);
  if (!body) return invalidBody();
  // An omitted billingPlanId is dropped by JSON.stringify and rejected by Admin,
  // so it can never unassign by accident.
  return handleAdminMutation(async () => ({
    store: await updateStoreBillingPlan(
      params.storeId,
      body.billingPlanId as string | null
    ),
  }));
}
