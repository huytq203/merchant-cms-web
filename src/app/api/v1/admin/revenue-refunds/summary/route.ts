import { NextResponse } from "next/server";
import { refundQuerySchema } from "@/features/revenue-refunds/schemas";
import { requirePermission } from "@/server/auth/require-permission";
import { badRequest, refundErrorResponse } from "@/server/modules/revenue-refunds/refund-response";
import { getRevenueRefundSummary } from "@/server/modules/revenue-refunds/revenue-refund.service";

/** Dải đếm theo nhóm trạng thái; cùng bộ lọc với danh sách (BE bỏ qua trạng thái). */
export async function GET(request: Request) {
  const access = await requirePermission("VIEW_REFUND");
  if (!access.ok) return access.response;
  const query = refundQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return badRequest("Tham số không hợp lệ");
  const result = await getRevenueRefundSummary(query.data);
  return result.success ? NextResponse.json(result.data) : refundErrorResponse(result.error);
}
