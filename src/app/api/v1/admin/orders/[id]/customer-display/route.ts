import { NextResponse } from "next/server";
import { canRefreshQr } from "@/features/orders/utils/order-mapper";
import { invalidIdResponse } from "@/lib/be/route-id";
import { createOrderDisplay } from "@/server/modules/customer-display/customer-display.service";
import { beErrorResponse, requireOrderAccess, requireOwnedOrder } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

/**
 * Mở màn "Hiển thị cho khách" cho một đơn. Cùng quyền với "Làm mới QR" (CREATE_ORDER): người đứng quầy
 * lập đơn rồi quay màn cho khách quét. Chỉ đơn còn chờ trả (ACTIVE) mới có mã để hiện.
 */
export async function POST(_request: Request, context: Context) {
  const access = await requireOrderAccess("CREATE_ORDER");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const order = await requireOwnedOrder(id, access.user);
  if (order instanceof NextResponse) return order;
  if (!canRefreshQr(order.status)) {
    return NextResponse.json({ message: "Đơn hàng không còn chờ thanh toán", code: "ORDER_NOT_PAYABLE" }, { status: 409 });
  }
  const result = await createOrderDisplay(order);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
