import { invalidIdResponse } from "@/lib/be/route-id";
import { submitWallet } from "@/server/modules/kyb/kyb.service";
import {
  requireKybAccess,
  requireOwnedWallet,
  toRouteResponse,
} from "@/server/modules/kyb/require-kyb-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const access = await requireKybAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const notOwned = await requireOwnedWallet(id, access.user);
  if (notOwned) return notOwned;
  return toRouteResponse(await submitWallet(id));
}
