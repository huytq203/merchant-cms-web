import { NextResponse } from "next/server";
import { createBodySchema } from "@/features/disbursements/schemas/disbursement.schema";
import { createDisbursement } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  createErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

/**
 * Tạo lệnh chi hộ đơn lẻ. BE kiểm OTP gắn đúng Sub + mã yêu cầu + số tiền + người nhận rồi mới gửi lệnh. 201 = lệnh mới,
 * 200 = lệnh cũ của cùng mã yêu cầu (gửi lại). Lỗi hệ thống luôn thành 503 "gửi lại cùng mã" vì lệnh có thể đã lưu.
 */
export async function POST(request: Request) {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const body = createBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const denied = requireSubScope(access.user, body.data.subId);
  if (denied) return denied;
  const result = await createDisbursement(body.data);
  if (!result.success) return createErrorResponse(result.error);
  // BE đánh dấu lệnh cũ bằng `replayed`; trả 200 để client phân biệt với lệnh mới (201).
  return NextResponse.json(result.data, { status: result.data.replayed ? 200 : 201 });
}
