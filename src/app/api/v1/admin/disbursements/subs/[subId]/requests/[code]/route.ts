import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { REQUEST_CODE_PATTERN } from "@/features/disbursements/schemas/disbursement.schema";
import { findDisbursement } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  disbursementErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

type Context = { params: Promise<{ subId: string; code: string }> };

/** Tra lại lệnh theo mã yêu cầu (sau khi tạo lệnh chưa xác nhận được kết quả). Chưa có lệnh → 404. */
export async function GET(_request: Request, context: Context) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const { subId, code } = await context.params;
  const invalidId = invalidIdResponse(subId);
  if (invalidId) return invalidId;
  if (!REQUEST_CODE_PATTERN.test(code)) return badRequest("Mã yêu cầu không hợp lệ");
  const denied = requireSubScope(access.user, subId);
  if (denied) return denied;
  const result = await findDisbursement(subId, code);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
