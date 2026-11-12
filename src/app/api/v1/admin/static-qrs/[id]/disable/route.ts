import { NextResponse } from "next/server";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { staticQrDisableSchema } from "@/features/static-qrs/schemas";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { disableStaticQr } from "@/server/modules/customer-display/customer-display.service";
import { requireOwnedStaticQr } from "@/server/modules/customer-display/require-static-qr-access";
import { beErrorResponse } from "@/server/modules/orders/require-order-access";

type Context = { params: Promise<{ id: string }> };

/** Tắt mã QR tĩnh (bắt buộc lý do, BE lưu `disabled_reason`); mã in ra giấy từ lúc này quét sẽ bị từ chối. */
export async function POST(request: Request, context: Context) {
  const access = await requirePermission(PERMISSION_GATES.terminalWrite);
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const body = staticQrDisableSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const qr = await requireOwnedStaticQr(id, access.user);
  if (qr instanceof NextResponse) return qr;
  if (qr.status !== "ACTIVE") {
    return NextResponse.json({ message: "Mã QR tĩnh đã tắt", code: "STATIC_QR_NOT_ACTIVE" }, { status: 409 });
  }
  const result = await disableStaticQr(id, body.data.reason);
  return result.success ? NextResponse.json(result.data ?? { ...qr, status: "DISABLED" }) : beErrorResponse(result.error);
}
