import { NextResponse } from "next/server";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { getSettlementItem } from "@/server/modules/settlement-items/settlement-item.service";

type Context = { params: Promise<{ id: string }> };

/** The BE scopes the item to the session and answers 404 outside it, so no ownership check is repeated here. */
export async function GET(_request: Request, context: Context) {
  const access = await requirePermission("VIEW_BALANCE");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await getSettlementItem(id);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
