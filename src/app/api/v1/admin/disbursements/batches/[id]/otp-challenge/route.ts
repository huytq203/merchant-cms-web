import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requestBatchOtp } from "@/server/modules/disbursements/disbursement.service";
import { disbursementErrorResponse, requireDisbursementAccess } from "@/server/modules/disbursements/disbursement-response";

type Context = { params: Promise<{ id: string }> };

/** Phát OTP gửi lô, gắn Sub + lô + băm file. Lô không gửi được (6325) thì BE không phát mã. */
export async function POST(_request: Request, context: Context) {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await requestBatchOtp(id);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
