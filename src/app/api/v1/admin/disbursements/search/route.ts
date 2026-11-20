import { NextResponse } from "next/server";
import { orderSearchBodySchema } from "@/features/disbursements/schemas/disbursement-filter.schema";
import { searchDisbursements } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  readErrorResponse,
  requireDisbursementAccess,
  requireSubsScope,
} from "@/server/modules/disbursements/disbursement-response";

/**
 * Danh sách lệnh chi hộ. POST để mã tìm kiếm không lên URL/log truy cập. `subIds` vắng = mọi Sub trong phạm vi phiên
 * (BE kiểm); phiên chỉ gán một số Sub thì không được chọn Sub khác (403 trước khi gọi BE). Lỗi đọc giữ nguyên 503 (6323).
 */
export async function POST(request: Request) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const body = orderSearchBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const denied = requireSubsScope(access.user, body.data.subIds);
  if (denied) return denied;
  const result = await searchDisbursements(body.data);
  return result.success ? NextResponse.json(result.data) : readErrorResponse(result.error);
}
