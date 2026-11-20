import { NextResponse } from "next/server";
import { otpChallengeBodySchema } from "@/features/disbursements/schemas/disbursement.schema";
import { requestDisbursementOtp } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  disbursementErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

/** Phát OTP cho đúng lệnh sắp tạo; thao tác nhạy cảm cố định ở BE, trình duyệt chỉ nêu Sub, mã, số tiền, người nhận. */
export async function POST(request: Request) {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const body = otpChallengeBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const denied = requireSubScope(access.user, body.data.subId);
  if (denied) return denied;
  const result = await requestDisbursementOtp(body.data);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
