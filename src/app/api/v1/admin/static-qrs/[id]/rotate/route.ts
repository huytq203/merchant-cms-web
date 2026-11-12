import { NextResponse } from "next/server";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { rotateStaticQr } from "@/server/modules/customer-display/customer-display.service";
import { requireOwnedStaticQr } from "@/server/modules/customer-display/require-static-qr-access";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

/** Xoay mã: BE tắt mã đang dùng và sinh mã mới cùng phạm vi (dùng khi mã cũ bị lộ hoặc in sai). */
export async function POST(_request: Request, context: Context) {
  const access = await requirePermission(PERMISSION_GATES.terminalWrite);
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const qr = await requireOwnedStaticQr(id, access.user);
  if (qr instanceof NextResponse) return qr;
  if (qr.status !== "ACTIVE") {
    return NextResponse.json({ message: "Chỉ đổi được mã đang dùng", code: "STATIC_QR_NOT_ACTIVE" }, { status: 409 });
  }
  const result = await rotateStaticQr(id);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
