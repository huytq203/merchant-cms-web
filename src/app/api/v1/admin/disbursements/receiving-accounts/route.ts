import { NextResponse } from "next/server";
import { z } from "zod";
import { listReceivingAccounts } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  disbursementErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

const querySchema = z.object({ subId: z.uuid().optional() });

/** Tài khoản bảo đảm để chuyển tiền nạp; danh sách rỗng nghĩa là chưa cấu hình. `subId` để kèm mã Sub vào nội dung chuyển khoản. */
export async function GET(request: Request) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return badRequest();
  if (query.data.subId) {
    const denied = requireSubScope(access.user, query.data.subId);
    if (denied) return denied;
  }
  const result = await listReceivingAccounts(query.data.subId);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
