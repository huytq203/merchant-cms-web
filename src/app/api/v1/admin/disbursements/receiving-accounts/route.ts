import { NextResponse } from "next/server";
import { z } from "zod";
import { listReceivingAccounts } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  disbursementErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

// `purpose` bắt buộc (FE luôn gửi); `refundId` chỉ có nghĩa trong phạm vi một Sub nên phải kèm `subId` để kiểm phạm vi.
const querySchema = z
  .object({ subId: z.uuid().optional(), purpose: z.enum(["CHI_HO", "HOAN"]), refundId: z.uuid().optional() })
  .refine((query) => !query.refundId || Boolean(query.subId), { path: ["subId"] });

/**
 * Tài khoản bảo đảm để chuyển tiền nạp theo mục đích (`purpose` CHI_HO | HOAN, HOAN kèm `refundId`); danh sách rỗng nghĩa là
 * chưa cấu hình. `subId` để kèm mã Sub vào nội dung chuyển khoản và kiểm phạm vi; có `refundId` mà thiếu `subId` thì 400.
 * BE kiểm hoàn thuộc Sub (404).
 */
export async function GET(request: Request) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return badRequest();
  if (query.data.subId) {
    const denied = requireSubScope(access.user, query.data.subId);
    if (denied) return denied;
  }
  const result = await listReceivingAccounts(query.data.subId, query.data.purpose, query.data.refundId);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
