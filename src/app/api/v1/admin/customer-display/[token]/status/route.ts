import { NextResponse } from "next/server";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";
import { requirePermission } from "@/server/auth/require-permission";
import { getDisplayStatus } from "@/server/modules/customer-display/customer-display.service";

type Context = { params: Promise<{ token: string }> };

/** Token HMAC của BE là chuỗi an toàn cho URL; mọi thứ khác bị chặn trước khi ghép vào đường BE. */
const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{1,512}$/;

/**
 * Màn hiển thị hỏi trạng thái mỗi 3 giây. Màn chạy trong phiên Portal đã đăng nhập, nên chỉ cần session
 * (không cần quyền riêng); quyền đọc trạng thái thật sự nằm ở `displayToken` mà BE kiểm.
 */
export async function GET(_request: Request, context: Context) {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  const { token } = await context.params;
  if (!TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ message: "Màn hiển thị không hợp lệ" }, { status: 404 });
  }
  const result = await getDisplayStatus(token);
  if (!result.success) return beErrorResponse(result.error);
  return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
}
