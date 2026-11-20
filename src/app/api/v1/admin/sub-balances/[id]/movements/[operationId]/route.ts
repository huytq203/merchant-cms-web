import { NextResponse } from "next/server";
import { movementPocketSchema } from "@/features/sub-balances/movement-schemas";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { toSubBalanceResponse } from "@/server/modules/sub-balances/sub-balance-response";
import { getSubBalanceMovement } from "@/server/modules/sub-balances/sub-balance.service";

type Context = { params: Promise<{ id: string; operationId: string }> };

/** The breakdown of one movement. An operation that is not this Sub's is a 404 from the BE, passed through. */
export async function GET(request: Request, context: Context) {
  const access = await requirePermission("VIEW_BALANCE");
  if (!access.ok) return access.response;
  const { id, operationId } = await context.params;
  const invalid = invalidIdResponse(id) ?? invalidIdResponse(operationId);
  if (invalid) return invalid;
  // The pocket the list was read with: amount and balance differ per pocket, so the detail must be read the same way.
  const rawPocket = new URL(request.url).searchParams.get("pocket");
  const pocket = rawPocket === null ? undefined : movementPocketSchema.safeParse(rawPocket);
  if (pocket && !pocket.success) {
    return NextResponse.json({ message: pocket.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  }
  return toSubBalanceResponse(await getSubBalanceMovement(id, operationId, pocket?.data));
}
