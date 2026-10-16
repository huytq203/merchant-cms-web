import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { refundErrorResponse } from "@/server/modules/revenue-refunds/refund-response";
import { requestApproveOtp } from "@/server/modules/revenue-refunds/revenue-refund.service";

type Context = { params: Promise<{ id: string }> };

/** A code that only approves this refund. */
export async function POST(_request: Request, context: Context) {
  const access = await requirePermission("APPROVE_REFUND");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await requestApproveOtp(id);
  return result.success ? NextResponse.json(result.data) : refundErrorResponse(result.error);
}
