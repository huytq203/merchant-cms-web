import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { getDisbursementOverview } from "@/server/modules/disbursements/disbursement.service";
import {
  disbursementErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

type Context = { params: Promise<{ subId: string }> };

/** Tổng quan chi hộ của một Sub: cấu hình dịch vụ, hạn mức, ngưỡng tự duyệt, số dư thu-chi hộ. */
export async function GET(_request: Request, context: Context) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const { subId } = await context.params;
  const invalidId = invalidIdResponse(subId);
  if (invalidId) return invalidId;
  const denied = requireSubScope(access.user, subId);
  if (denied) return denied;
  const result = await getDisbursementOverview(subId);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
