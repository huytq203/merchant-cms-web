import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { staticQrCreateSchema } from "@/features/static-qrs/schemas";
import { requirePermission } from "@/server/auth/require-permission";
import { createStaticQr, listStaticQrs } from "@/server/modules/customer-display/customer-display.service";
import { beErrorResponse, requireSubMerchantScope } from "@/server/modules/orders/require-order-access";

/**
 * QR tĩnh theo Sub/Terminal. Quyền dùng lại nhóm quyền Terminal hiện có (điểm mở M3 của thiết kế đề xuất
 * không thêm quyền mới): xem cần VIEW_TERMINAL hoặc MANAGE_TERMINAL, tạo/tắt/xoay cần MANAGE_TERMINAL.
 */
const listQuerySchema = z.object({
  subMerchantId: z.uuid(),
  terminalId: z.uuid().optional(),
});

export async function GET(request: NextRequest) {
  const access = await requirePermission(PERMISSION_GATES.terminalRead);
  if (!access.ok) return access.response;
  const query = listQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return NextResponse.json({ message: "Chọn Sub-merchant" }, { status: 400 });
  // Danh sách luôn theo một Sub trong phạm vi của người dùng, không bao giờ theo id client tự gửi ngoài phạm vi.
  const denied = requireSubMerchantScope(access.user, query.data.subMerchantId);
  if (denied) return denied;
  const result = await listStaticQrs(query.data);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}

export async function POST(request: Request) {
  const access = await requirePermission(PERMISSION_GATES.terminalWrite);
  if (!access.ok) return access.response;
  const body = staticQrCreateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
  const denied = requireSubMerchantScope(access.user, body.data.subMerchantId);
  if (denied) return denied;
  const result = await createStaticQr(body.data);
  return result.success ? NextResponse.json(result.data, { status: 201 }) : beErrorResponse(result.error);
}
