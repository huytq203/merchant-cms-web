import { NextResponse } from "next/server";
import { canRefreshQr } from "@/features/orders/utils/order-mapper";
import { invalidIdResponse } from "@/lib/be/route-id";
import { refreshOrderQr } from "@/server/modules/orders/order.service";
import {
  beErrorResponse,
  requireOrderAccess,
  requireOwnedOrder,
} from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const access = await requireOrderAccess("CREATE_ORDER");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const order = await requireOwnedOrder(id, access.user);
  if (order instanceof NextResponse) return order;
  if (!canRefreshQr(order.status)) {
    return NextResponse.json({ message: "Không thể làm mới QR cho đơn hàng này" }, { status: 409 });
  }
  const result = await refreshOrderQr(id);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
