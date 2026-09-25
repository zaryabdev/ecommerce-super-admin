import { createBillingPlan } from "@/lib/admin-api";
import {
  handleAdminMutation,
  invalidBody,
  readJsonObject,
} from "@/lib/admin-mutation";
import type { SuperAdminCreateBillingPlanInput } from "@/types/super-admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJsonObject(req);
  if (!body) return invalidBody();
  return handleAdminMutation(
    async () => ({
      plan: await createBillingPlan(body as unknown as SuperAdminCreateBillingPlanInput),
    }),
    201
  );
}
