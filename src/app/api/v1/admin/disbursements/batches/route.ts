import { NextResponse } from "next/server";
import { z } from "zod";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { listDisbursementBatches } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  readErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

const listQuerySchema = paginationQuerySchema.extend({
  subId: z.uuid().optional(),
  status: z.enum(["DRAFT", "SUBMITTING", "COMPLETED", "EXPIRED"]).optional(),
});

/**
 * Danh sách lô của phạm vi phiên kèm tổng hợp trạng thái lệnh. Trang của UI đánh số từ 1, BE từ 0. `subId` vắng = mọi Sub
 * trong phạm vi; Sub ngoài phạm vi phiên bị chặn trước khi gọi BE.
 */
export async function GET(request: Request) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const query = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return badRequest();
  if (query.data.subId) {
    const denied = requireSubScope(access.user, query.data.subId);
    if (denied) return denied;
  }
  const result = await listDisbursementBatches({
    page: query.data.page - 1,
    size: query.data.pageSize,
    ...(query.data.subId ? { subId: query.data.subId } : {}),
    ...(query.data.status ? { status: query.data.status } : {}),
  });
  return result.success ? NextResponse.json(result.data) : readErrorResponse(result.error);
}
