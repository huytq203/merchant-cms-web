import { NextResponse } from "next/server";
import { approveRefundBodySchema } from "@/features/revenue-refunds/schemas";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { badRequest, refundErrorResponse } from "@/server/modules/revenue-refunds/refund-response";
import { approveRevenueRefund } from "@/server/modules/revenue-refunds/revenue-refund.service";

type Context = { params: Promise<{ id: string }> };

/** Approval only queues the ledger write: the refund comes back PROCESSING, the final state arrives later. */
export async function POST(request: Request, context: Context) {
  const access = await requirePermission("APPROVE_REFUND");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const body = approveRefundBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest("Vui lòng nhập mã OTP để xác nhận.");
  const result = await approveRevenueRefund(id, body.data.sensitiveOtp);
  return result.success ? NextResponse.json(result.data) : refundErrorResponse(result.error);
}
