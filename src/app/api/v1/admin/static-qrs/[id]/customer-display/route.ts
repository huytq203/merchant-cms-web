import { NextResponse } from "next/server";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { createStaticQrDisplay } from "@/server/modules/customer-display/customer-display.service";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

/**
 * Mở màn hiển thị cho mã QR tĩnh của quầy. Không đọc trước `GET /static-qrs/{id}` (cần quyền Terminal mà thu ngân
 * thường không có): BE tự kiểm phạm vi (404) và mã đã tắt (409 `6314`), response đã đủ dữ liệu cho màn.
 */
export async function POST(_request: Request, context: Context) {
  const access = await requirePermission(PERMISSION_GATES.staticQrDisplay);
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await createStaticQrDisplay(id);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
