import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { getDisbursementOrder } from "@/server/modules/disbursements/disbursement.service";
import { readErrorResponse, requireDisbursementAccess } from "@/server/modules/disbursements/disbursement-response";

type Context = { params: Promise<{ id: string }> };

/** Chi tiết lệnh (STK che, không thông tin nội bộ). BE trả 404 cho lệnh của Sub ngoài phạm vi phiên. */
export async function GET(_request: Request, context: Context) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await getDisbursementOrder(id);
  return result.success ? NextResponse.json(result.data) : readErrorResponse(result.error);
}
