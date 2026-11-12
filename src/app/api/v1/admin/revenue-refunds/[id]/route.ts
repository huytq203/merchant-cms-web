import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { refundErrorResponse } from "@/server/modules/revenue-refunds/refund-response";
import { getRevenueRefund } from "@/server/modules/revenue-refunds/revenue-refund.service";

type Context = { params: Promise<{ id: string }> };

/** Chi tiết một yêu cầu hoàn tiền (modal chi tiết, `?detail=`); quyền xem giống danh sách, phạm vi do BE kiểm. */
export async function GET(_request: Request, context: Context) {
  const access = await requirePermission("VIEW_REFUND");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await getRevenueRefund(id);
  return result.success ? NextResponse.json(result.data) : refundErrorResponse(result.error);
}
