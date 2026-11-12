import { NextResponse } from "next/server";
import { canRefreshQr } from "@/features/orders/utils/order-mapper";
import { invalidIdResponse } from "@/lib/be/route-id";
import { createOrderDisplay } from "@/server/modules/customer-display/customer-display.service";
import { requirePermission } from "@/server/auth/require-permission";
import { beErrorResponse, requireOwnedOrder } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

/**
 * Mở màn QR hiển thị cho khách của một đơn: đây là màn của nút "Xem mã QR", nên ai xem được đơn (VIEW_ORDER) hoặc
 * lập đơn (CREATE_ORDER) đều mở được, khớp quyền của BE. Chỉ đơn còn chờ trả (ACTIVE) mới có mã để hiện.
 */
export async function POST(_request: Request, context: Context) {
  const access = await requirePermission(["CREATE_ORDER", "VIEW_ORDER"]);
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
