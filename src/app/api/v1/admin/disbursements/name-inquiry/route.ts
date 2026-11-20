import { NextResponse } from "next/server";
import { nameInquiryBodySchema } from "@/features/disbursements/schemas/disbursement.schema";
import { inquireRecipientName } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  inquiryErrorResponse,
  requireDisbursementAccess,
  requireSubScope,
} from "@/server/modules/disbursements/disbursement-response";

/** Tra tên chủ tài khoản nhận (BE giới hạn 30 lần/phút mỗi người dùng, quá thì 429). */
export async function POST(request: Request) {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const body = nameInquiryBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const denied = requireSubScope(access.user, body.data.subId);
  if (denied) return denied;
  const result = await inquireRecipientName(body.data);
  return result.success ? NextResponse.json(result.data) : inquiryErrorResponse(result.error);
}
