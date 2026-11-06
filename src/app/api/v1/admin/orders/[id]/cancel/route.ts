import { NextResponse } from "next/server";
import { ORDER_CANCEL_CODES } from "@/features/orders/constants/order-cancel";
import { canCancelOrder } from "@/features/orders/utils/order-mapper";
import { invalidIdResponse } from "@/lib/be/route-id";
import { toCancelFailure } from "@/server/modules/orders/order-cancel-error";
import { cancelOrder } from "@/server/modules/orders/order.service";
import { requireOrderAccess, requireOwnedOrder } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const access = await requireOrderAccess("CANCEL_ORDER");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const order = await requireOwnedOrder(id, access.user);
  if (order instanceof NextResponse) return order;
  if (!canCancelOrder(order.status)) {
    return NextResponse.json(
      { message: "Chỉ hủy được đơn đang chờ thanh toán", code: ORDER_CANCEL_CODES.notCancellable },
      { status: 409 },
    );
  }
  const result = await cancelOrder(id);
  if (result.success) return NextResponse.json(result.data);
  const failure = toCancelFailure(result.error);
  return NextResponse.json(failure.body, { status: failure.status });
}
