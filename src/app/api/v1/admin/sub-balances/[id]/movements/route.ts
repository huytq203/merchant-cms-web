import { NextResponse } from "next/server";
import { movementFilterSchema } from "@/features/sub-balances/movement-schemas";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { toSubBalanceResponse } from "@/server/modules/sub-balances/sub-balance-response";
import { listSubBalanceMovements } from "@/server/modules/sub-balances/sub-balance.service";

type Context = { params: Promise<{ id: string }> };

/** Movements of one Sub's available balance. VIEW_BALANCE is the permission the BE checks; the BE also scopes the Sub to the session. */
export async function GET(request: Request, context: Context) {
  const access = await requirePermission("VIEW_BALANCE");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalid = invalidIdResponse(id);
  if (invalid) return invalid;
  const filter = movementFilterSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!filter.success) {
    return NextResponse.json({ message: filter.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  }
  return toSubBalanceResponse(await listSubBalanceMovements(id, filter.data));
}
