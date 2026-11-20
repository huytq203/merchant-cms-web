import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { getDisbursementBatch } from "@/server/modules/disbursements/disbursement.service";
import { disbursementErrorResponse, requireDisbursementAccess } from "@/server/modules/disbursements/disbursement-response";

type Context = { params: Promise<{ id: string }> };

/** Chi tiết lô: tổng hợp + từng dòng (STK đã che, kết quả gửi). BE kiểm lô thuộc phạm vi phiên (404). */
export async function GET(_request: Request, context: Context) {
  const access = await requireDisbursementAccess("VIEW_DISBURSEMENT");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const result = await getDisbursementBatch(id);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
