import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { toSubBalanceResponse } from "@/server/modules/sub-balances/sub-balance-response";
import { getSubBalanceMovement } from "@/server/modules/sub-balances/sub-balance.service";

type Context = { params: Promise<{ id: string; operationId: string }> };

/** The breakdown of one movement. An operation that is not this Sub's is a 404 from the BE, passed through. */
export async function GET(_request: Request, context: Context) {
  const access = await requirePermission("VIEW_BALANCE");
  if (!access.ok) return access.response;
  const { id, operationId } = await context.params;
  const invalid = invalidIdResponse(id) ?? invalidIdResponse(operationId);
  if (invalid) return invalid;
  return toSubBalanceResponse(await getSubBalanceMovement(id, operationId));
}
