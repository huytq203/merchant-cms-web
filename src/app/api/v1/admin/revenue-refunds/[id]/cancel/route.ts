import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { refundErrorResponse } from "@/server/modules/revenue-refunds/refund-response";
import { cancelRevenueRefund } from "@/server/modules/revenue-refunds/revenue-refund.service";

type Context = { params: Promise<{ id: string }> };

/**
 * Hủy yêu cầu đang Chờ phê duyệt. Quyền vào route giống BE (MerchantRevenueRefundPortalController.cancel): tạo, duyệt
 * HOẶC hủy hoàn tiền. BE kiểm tiếp "người tạo, hoặc người có CANCEL_REFUND/APPROVE_REFUND" và "chỉ yêu cầu do Portal
 * tạo" nên route không tự quyết thay BE.
 */
export async function POST(_request: Request, context: Context) {
  const access = await requirePermission(["CREATE_REFUND", "APPROVE_REFUND", "CANCEL_REFUND"]);
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await cancelRevenueRefund(id);
  return result.success ? NextResponse.json(result.data) : refundErrorResponse(result.error);
}
