import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requireOrderAccess, requireOwnedOrder } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireOrderAccess("VIEW_ORDER");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const order = await requireOwnedOrder(id, access.user);
  return order instanceof NextResponse ? order : NextResponse.json(order);
}
