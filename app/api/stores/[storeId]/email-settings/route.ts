import { updateStoreEmailSettings } from "@/lib/admin-api";
import {
  handleAdminMutation,
  invalidBody,
  readJsonObject,
} from "@/lib/admin-mutation";

export const dynamic = "force-dynamic";

// Relays { emailDeliveryBlocked: boolean } to Admin, which validates it and owns
// the Store field. A non-boolean is rejected by Admin (400), never coerced here.
export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const body = await readJsonObject(req);
  if (!body) return invalidBody();
  return handleAdminMutation(async () => ({
    store: await updateStoreEmailSettings(
      params.storeId,
      body.emailDeliveryBlocked as boolean
    ),
  }));
}
