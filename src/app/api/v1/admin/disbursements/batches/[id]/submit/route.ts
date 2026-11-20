import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { batchSubmitBodySchema } from "@/features/disbursements/schemas/disbursement.schema";
import { submitDisbursementBatch } from "@/server/modules/disbursements/disbursement.service";
import {
  badRequest,
  disbursementErrorResponse,
  requireDisbursementAccess,
} from "@/server/modules/disbursements/disbursement-response";

type Context = { params: Promise<{ id: string }> };

/** Gửi lô: bắt buộc OTP đủ hai nửa và phiên bản lô vừa xem; BE gửi từng lệnh hợp lệ ở nền. */
export async function POST(request: Request, context: Context) {
  const access = await requireDisbursementAccess("CREATE_DISBURSEMENT");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const body = batchSubmitBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const result = await submitDisbursementBatch(id, body.data);
  return result.success ? NextResponse.json(result.data) : disbursementErrorResponse(result.error);
}
