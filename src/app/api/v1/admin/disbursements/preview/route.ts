import { NextResponse } from "next/server";
import { previewBodySchema } from "@/features/disbursements/schemas/disbursement.schema";
import { previewDisbursement } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  disbursementErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

/** Xem trước phí, số trừ số dư, thực nhận và hạn mức còn lại (ước tính; số chốt do hệ thống chi tính lúc nhận lệnh). */
export async function POST(request: Request) {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const body = previewBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const denied = requireSubScope(access.user, body.data.subId);
  if (denied) return denied;
  const result = await previewDisbursement(body.data);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
