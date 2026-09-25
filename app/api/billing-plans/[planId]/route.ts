import { updateBillingPlan } from "@/lib/admin-api";
import {
  handleAdminMutation,
  invalidBody,
  readJsonObject,
} from "@/lib/admin-mutation";
import type { SuperAdminUpdateBillingPlanInput } from "@/types/super-admin-api";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { planId: string } }
) {
  const body = await readJsonObject(req);
  if (!body) return invalidBody();
  return handleAdminMutation(async () => ({
    plan: await updateBillingPlan(
      params.planId,
      body as SuperAdminUpdateBillingPlanInput
    ),
  }));
}
