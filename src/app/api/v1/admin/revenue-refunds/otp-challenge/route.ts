import { NextResponse } from "next/server";
import { createOtpBodySchema } from "@/features/revenue-refunds/schemas";
import { requirePermission } from "@/server/auth/require-permission";
import { badRequest, refundErrorResponse } from "@/server/modules/revenue-refunds/refund-response";
import { requestCreateOtp } from "@/server/modules/revenue-refunds/revenue-refund.service";

/** The code is bound to this order and amount; changing the amount afterwards needs a new code. */
export async function POST(request: Request) {
  const access = await requirePermission("CREATE_REFUND");
  if (!access.ok) return access.response;
  const body = createOtpBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Dữ liệu không hợp lệ");
  const result = await requestCreateOtp(body.data.orderId, body.data.amount);
  return result.success ? NextResponse.json(result.data) : refundErrorResponse(result.error);
}
