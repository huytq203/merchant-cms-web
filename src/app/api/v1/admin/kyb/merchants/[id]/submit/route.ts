import { invalidIdResponse } from "@/lib/be/route-id";
import { submitMerchant } from "@/server/modules/kyb/kyb.service";
import {
  requireKybAccess,
  requireMerchantScope,
  toRouteResponse,
} from "@/server/modules/kyb/require-kyb-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const access = await requireKybAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const outOfScope = requireMerchantScope(access.user, id);
  if (outOfScope) return outOfScope;
  return toRouteResponse(await submitMerchant(id));
}
